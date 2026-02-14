import React from "react";
import { setCurrentLineIndex } from "../../store/traces-store/0-1-files-current-state";
import { allTimesStore } from "../../store/traces-store/3-1-all-times-store";
import { type TraceLine } from "@/trace-viewer-core/9-core-types";
import { ITEM_HEIGHT } from "./9-trace-view-constants";

export function scrollToSelection(currentLineIndex: number, scrollRef: React.RefObject<HTMLDivElement | null>, containerHeight: number) {
    if (currentLineIndex >= 0 && scrollRef.current) {
        const targetTop = currentLineIndex * ITEM_HEIGHT;
        const targetBottom = targetTop + ITEM_HEIGHT;
        const viewTop = scrollRef.current.scrollTop;
        const viewBottom = viewTop + containerHeight;

        // If we are handling a pending scroll (just processed), we might want to center or force scroll.
        // But standard behavior: ensure visible.

        if (targetTop < viewTop) {
            scrollRef.current.scrollTop = targetTop;
        } else if (targetBottom > viewBottom) {
            scrollRef.current.scrollTop = targetBottom - containerHeight;
        }
    }
    // pendingScrollTimestamp is cleared in the other effect, but we want to ensure this runs 
    // after that calculation updates currentLineIndex. 
    // Since that effect updates currentLineIndex, this effect will trigger naturally.
}

export function handlePendingTimestampScroll(
    pendingScrollTimestamp: string | null,
    pendingScrollFileId: string | null | undefined,
    viewLines: readonly TraceLine[],
    scrollRef: React.RefObject<HTMLDivElement | null>,
    containerHeight: number,
    currentFileId: string | null,
    baseIndexToDisplayIndex?: readonly number[]
) {
    if (!pendingScrollTimestamp || viewLines.length === 0) return;

    // If pending scroll is for a specific file, ensure we are on that file
    if (pendingScrollFileId && pendingScrollFileId !== currentFileId) {
        return;
    }

    const target = splitPendingTimestamp(pendingScrollTimestamp);

    let bestIndex = -1;

    // If we have a date, we MUST include date in matching (otherwise time-only may pick the wrong day).
    if (target.date && target.time) {
        bestIndex = findBestIndexForDateTime(viewLines, target.date, target.time);
    } else if (target.time) {
        // Time-only fallback (previous behavior).
        bestIndex = findBestIndexForTimeOnly(viewLines, target.time);
    }

    // Apply selection
    if (bestIndex !== -1) {
        setCurrentLineIndex(bestIndex);
        // Force scroll to this index even if it was already selected?
        // The scroll effect depends on currentLineIndex change.
        // If bestIndex === currentLineIndex, the other effect won't fire unless we force it.
        // But we can manually trigger scroll here if we want to be sure.

        // Actually, simply setting it might not trigger effect if value is same.
        // But if user clicked timeline, they expect to see it. 
        // We can add a "forceScroll" flag or just rely on the fact that usually we are navigating to a new place.
        // If we are already there, maybe scrolling is not needed?
        // The user complaint says "no scroll but it should be". This implies it IS out of view but didn't scroll.
        // This happens if currentLineIndex was ALREADY bestIndex, so state didn't change, so useEffect didn't fire.

        // To fix: we can trigger a scroll imperatively here.
        if (scrollRef.current) {
            const displayIndex = baseIndexToDisplayIndex ? (baseIndexToDisplayIndex[bestIndex] ?? -1) : bestIndex;
            if (displayIndex < 0) {
                // line is currently filtered out, let selection change stand and skip scroll
                allTimesStore.pendingScrollTimestamp = null;
                allTimesStore.pendingScrollFileId = null;
                return;
            }

            const targetTop = displayIndex * ITEM_HEIGHT;
            const targetBottom = targetTop + ITEM_HEIGHT;
            const viewTop = scrollRef.current.scrollTop;
            const viewBottom = viewTop + containerHeight; // containerHeight is from state, might be stale? No, it's updated on resize.

            if (targetTop < viewTop) {
                scrollRef.current.scrollTop = targetTop;
            } else if (targetBottom > viewBottom) {
                scrollRef.current.scrollTop = targetBottom - containerHeight;
            }
        }
    }

    // Clear pending timestamp
    allTimesStore.pendingScrollTimestamp = null;
    allTimesStore.pendingScrollFileId = null;
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
