import { type TraceLine } from "./9-core-types";

export function findBestIndexForPendingScrollTimestamp(viewLines: readonly TraceLine[], pendingScrollTimestamp: string): number {
    const target = splitPendingTimestamp(pendingScrollTimestamp);

    // If we have a date, we MUST include date in matching (otherwise time-only may pick the wrong day).
    if (target.date && target.time) {
        return findBestIndexForDateTime(viewLines, target.date, target.time);
    }

    if (target.time) {
        // Time-only fallback (previous behavior).
        return findBestIndexForTimeOnly(viewLines, target.time);
    }

    return -1;
}

function splitPendingTimestamp(pendingScrollTimestamp: string): { date: string | null; time: string | null; } {
    const trimmed = pendingScrollTimestamp.trim();
    if (!trimmed) return { date: null, time: null };

    if (!trimmed.includes(' ')) {
        return { date: null, time: trimmed };
    }

    const parts = trimmed.split(' ').filter(Boolean);
    if (parts.length < 2) {
        return { date: null, time: trimmed };
    }

    return {
        date: parts.slice(0, parts.length - 1).join(' '),
        time: parts[parts.length - 1] ?? null,
    };
}

function findBestIndexForDateTime(viewLines: readonly TraceLine[], targetDate: string, targetTimePrefix: string): number {
    const targetDateMsUtc = parseMdyToUtcMidnightMs(targetDate);
    if (targetDateMsUtc === null) {
        // If date parsing fails, fall back to time-only rather than doing the wrong thing.
        return findBestIndexForTimeOnly(viewLines, targetTimePrefix);
    }

    const timeRange = getTimeRangeMsWithinDay(targetTimePrefix);
    if (!timeRange) {
        return findBestIndexForTimeOnly(viewLines, targetTimePrefix);
    }

    const rangeStart = targetDateMsUtc + timeRange.minMs;
    const rangeEnd = targetDateMsUtc + timeRange.maxMs;
    const rangeCenter = (rangeStart + rangeEnd) / 2;

    // Lower-bound search for the first line >= rangeStart.
    let low = 0;
    let high = viewLines.length - 1;
    let insertionIndex = viewLines.length;

    while (low <= high) {
        const mid = (low + high) >>> 1;
        const v = getLineDateTimeValueMs(viewLines[mid]);
        if (v === null) {
            // Typically only happens before any Day/Time lines; move forward.
            low = mid + 1;
            continue;
        }
        if (v >= rangeStart) {
            insertionIndex = mid;
            high = mid - 1;
        } else {
            low = mid + 1;
        }
    }

    // Priority 1: find a prefix match within the selected date and time bucket.
    for (let i = insertionIndex; i < viewLines.length; i++) {
        const line = viewLines[i];
        if (!line.timestamp) continue;

        // Date mismatch: stop once we go past the requested date.
        if (line.date !== targetDate) {
            const lineDateMs = line.date ? parseMdyToUtcMidnightMs(line.date) : null;
            if (lineDateMs !== null && lineDateMs > targetDateMsUtc) break;
            continue;
        }

        const v = getLineDateTimeValueMs(line);
        if (v !== null && v > rangeEnd) break;

        if (line.timestamp.startsWith(targetTimePrefix)) {
            return i;
        }
    }

    // Priority 2: closest by time (still pinned to the selected date).
    let bestIndex = -1;
    let minDiff = Infinity;
    const range = 10;
    const start = Math.max(0, insertionIndex - range);
    const end = Math.min(viewLines.length - 1, insertionIndex + range);

    for (let i = start; i <= end; i++) {
        const line = viewLines[i];
        if (line.date !== targetDate) continue;
        const v = getLineDateTimeValueMs(line);
        if (v === null) continue;
        const diff = Math.abs(v - rangeCenter);
        if (diff < minDiff) {
            minDiff = diff;
            bestIndex = i;
        }
    }

    if (bestIndex === -1) {
        // If we didn't find anything on this date (or date mapping is missing),
        // fall back to time-only rather than doing nothing.
        return findBestIndexForTimeOnly(viewLines, targetTimePrefix);
    }

    return bestIndex;
}

function findBestIndexForTimeOnly(viewLines: readonly TraceLine[], targetTimestampStr: string): number {
    // Parse target timestamp to ms for accurate comparison
    const targetTime = parseTimeMsWithinDay(targetTimestampStr);
    let bestIndex = -1;
    let minDiff = Infinity;

    // Binary search for insertion point (first line >= targetTimestampStr)
    let low = 0;
    let high = viewLines.length - 1;
    let insertionIndex = viewLines.length;

    while (low <= high) {
        const mid = (low + high) >>> 1;
        const tStr = viewLines[mid].timestamp;
        if (!tStr) {
            low = mid + 1;
            continue;
        }
        // Use string comparison on cleaned timestamp
        if (tStr >= targetTimestampStr) {
            insertionIndex = mid;
            high = mid - 1;
        } else {
            low = mid + 1;
        }
    }

    // Priority 1: Check for prefix match (starts with) starting from insertionIndex
    if (insertionIndex < viewLines.length) {
        const tStr = viewLines[insertionIndex].timestamp;
        if (tStr && tStr.startsWith(targetTimestampStr)) {
            bestIndex = insertionIndex;
        }
    }

    // Priority 2: If no prefix match, look for closest by time difference
    if (bestIndex === -1) {
        const candidates = [];
        const range = 5;
        for (let i = Math.max(0, insertionIndex - range); i <= Math.min(viewLines.length - 1, insertionIndex + range); i++) {
            candidates.push(i);
        }

        for (const idx of candidates) {
            const tStr = viewLines[idx].timestamp;
            if (tStr) {
                const tVal = parseTimeMsWithinDay(tStr);
                const diff = Math.abs(tVal - targetTime);
                if (diff < minDiff) {
                    minDiff = diff;
                    bestIndex = idx;
                }
            }
        }
    }

    return bestIndex;
}

function getLineDateTimeValueMs(line: TraceLine): number | null {
    if (!line.date || !line.timestamp) return null;
    const dateMsUtc = parseMdyToUtcMidnightMs(line.date);
    if (dateMsUtc === null) return null;
    return dateMsUtc + parseTimeMsWithinDay(line.timestamp);
}

function parseTimeMsWithinDay(t: string): number {
    const [hms, msPart] = t.split('.');
    if (!hms) return 0;
    const [h, m, s] = hms.split(':').map(Number);
    // Pad milliseconds to ensure proper decimal comparison (e.g. .5 -> 500ms, .05 -> 50ms)
    const ms = parseInt((msPart || '').padEnd(3, '0').slice(0, 3), 10);
    return ((h || 0) * 3600 + (m || 0) * 60 + (s || 0)) * 1000 + (ms || 0);
}

function getTimeRangeMsWithinDay(timePrefix: string): { minMs: number; maxMs: number; } | null {
    // Handles the same precision output as all-times worker:
    // - HH:MM
    // - HH:MM:S (10-second bucket)
    // - HH:MM:SS
    // - HH:MM:SS.m / .mm / .mmm
    const parts = timePrefix.split(':');
    if (parts.length < 2) return null;

    const h = Number(parts[0] ?? 0);
    const m = Number(parts[1] ?? 0);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;

    // HH:MM
    if (parts.length === 2) {
        const minMs = ((h * 3600) + (m * 60)) * 1000;
        const maxMs = minMs + (60 * 1000) - 1;
        return { minMs, maxMs };
    }

    const secPart = parts[2] ?? '0';
    if (!secPart) return null;

    // HH:MM:S  (single digit, bucket of 10 seconds)
    if (!secPart.includes('.') && secPart.length === 1) {
        const tens = Number(secPart);
        if (!Number.isFinite(tens)) return null;
        const minSeconds = tens * 10;
        const maxSeconds = (tens * 10) + 10 - 0.001; // inclusive
        return {
            minMs: ((h * 3600) + (m * 60) + minSeconds) * 1000,
            maxMs: ((h * 3600) + (m * 60) + maxSeconds) * 1000,
        };
    }

    // HH:MM:SS[.ms]
    const [secStr, msStr = ''] = secPart.split('.');
    const s = Number(secStr ?? 0);
    if (!Number.isFinite(s)) return null;

    if (!msStr) {
        const minMs = ((h * 3600) + (m * 60) + s) * 1000;
        const maxMs = minMs + 1000 - 1;
        return { minMs, maxMs };
    }

    // msStr length determines bucket size
    const digits = Math.min(3, msStr.length);
    const bucketSizeMs = 10 ** (3 - digits); // 1->100ms, 2->10ms, 3->1ms
    const msBase = Number(msStr.padEnd(3, '0').slice(0, 3));
    if (!Number.isFinite(msBase)) return null;

    const minMs = ((h * 3600) + (m * 60) + s) * 1000 + msBase;
    const maxMs = minMs + bucketSizeMs - 1;
    return { minMs, maxMs };
}

function parseMdyToUtcMidnightMs(mdy: string): number | null {
    // Trace format is documented as MDY.
    // Supports: M/D/YY, MM/DD/YY, M/D/YYYY, MM/DD/YYYY
    const m = mdy.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
    if (!m) return null;
    const month = Number(m[1]);
    const day = Number(m[2]);
    let year = Number(m[3]);
    if (!Number.isFinite(month) || !Number.isFinite(day) || !Number.isFinite(year)) return null;
    if (year < 100) year = 2000 + year;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return Date.UTC(year, month - 1, day);
}
