import { type TimelineWorkerInput, type TimelineWorkerOutput, type TimelineItem } from './timeline-types';

self.onmessage = (e: MessageEvent<TimelineWorkerInput>) => {
    const { type, files, precision } = e.data;

    if (type !== 'BUILD') return;

    try {
        const timestampMap = new Map<string, Set<string>>();

        for (const file of files) {
            for (const line of file.lines) {
                if (!line.timestamp) continue;

                const formatted = formatTimestamp(line.timestamp, precision);
                if (!formatted) continue;

                if (!timestampMap.has(formatted)) {
                    timestampMap.set(formatted, new Set());
                }
                timestampMap.get(formatted)!.add(file.id);
            }
        }

        const timeline: TimelineItem[] = Array.from(timestampMap.entries())
            .map(([timestamp, fileIdSet]) => ({
                timestamp,
                fileIds: Array.from(fileIdSet)
            }))
            .sort((a, b) => compareTimestamps(a.timestamp, b.timestamp));

        const response: TimelineWorkerOutput = {
            type: 'SUCCESS',
            timeline
        };

        self.postMessage(response);

    } catch (error: any) {
        const response: TimelineWorkerOutput = {
            type: 'ERROR',
            error: error.message || 'Unknown error during timeline build'
        };
        self.postMessage(response);
    }
};

function formatTimestamp(ts: string, precision: number): string | null {
    // Expected format: HH:MM:SS.mmm or similar
    // We assume the timestamp is somewhat valid.
    // Examples: "11:16:47.515"

    // If precision logic:
    // 5: HH:MM
    // 4: HH:MM:S (10s)
    // 3: HH:MM:SS.mmm (Full)
    // 2: HH:MM:SS.mm
    // 1: HH:MM:SS.m
    // 0: HH:MM:SS

    // Split by :
    const parts = ts.split(':');
    if (parts.length < 3) return ts; // Unexpected format, return as is or null?

    const hours = parts[0];
    const minutes = parts[1];
    const secondsAndMs = parts[2]; // "47.515" or "47"

    if (precision === 5) {
        return `${hours}:${minutes}`;
    }

    if (precision === 4) {
        // HH:MM:S (first digit of seconds)
        // secondsAndMs can be "47.515" -> "4"
        const secondsFirstDigit = secondsAndMs.charAt(0);
        return `${hours}:${minutes}:${secondsFirstDigit}`;
    }

    // For precision 0-3, we handle seconds and ms
    const secParts = secondsAndMs.split('.');
    const seconds = secParts[0];
    const ms = secParts[1] || '';

    if (precision === 0) {
        return `${hours}:${minutes}:${seconds}`;
    }

    // precision 1, 2, 3
    // We take N digits of ms
    const msTruncated = ms.substring(0, precision);
    
    // If we want to pad? The requirement examples don't show padding for shorter ms.
    // "11:16:47.5"
    if (msTruncated.length > 0) {
        return `${hours}:${minutes}:${seconds}.${msTruncated}`;
    } else {
         // Fallback if no ms existed but precision > 0 requested?
         // E.g. precision 2, ts "11:16:47". Result "11:16:47".
         return `${hours}:${minutes}:${seconds}`;
    }
}

function compareTimestamps(a: string, b: string): number {
    // Simple string comparison might work if padded.
    // "1:00" vs "11:00" -> "1:00" > "11:00" is FALSE. "1" < "11"? No, "1" vs "1" is same, next char ":" vs "1". ":" (58) vs "1" (49).
    // So "1:..." > "11:..." ?
    // '1'.charCodeAt(0) = 49
    // ':'.charCodeAt(0) = 58
    // So "1:" > "11" is true. This is wrong sort.
    // We need to parse.
    
    return parseToValue(a) - parseToValue(b);
}

function parseToValue(ts: string): number {
    // Convert to ms or some comparable number
    // HH:MM:SS.mmm
    // Or HH:MM
    // Or HH:MM:S
    
    const parts = ts.split(':');
    const h = parseInt(parts[0] || '0', 10);
    const m = parseInt(parts[1] || '0', 10);
    
    let s = 0;
    let ms = 0;
    
    if (parts.length > 2) {
        const secStr = parts[2];
        // Check for decimal
        if (secStr.includes('.')) {
            const [sec, msStr] = secStr.split('.');
            s = parseInt(sec, 10);
            // msStr can be "5", "51", "515"
            // We need to normalize to ms value. "5" -> 500ms? "51" -> 510ms?
            // Actually for sorting, we just need lexical order of the fractional part IF it was same length.
            // But here "11:16:47.5" vs "11:16:47.51".
            // 5 vs 51. 5 < 51.
            // But time-wise, .5 is 500ms, .51 is 510ms.
            // .5 < .51.
            // String comparison of "5" vs "51": "5" > "51" is FALSE. "5" vs "5". Next char undefined vs "1".
            // "5" < "51".
            // So if we just treat the decimal part as a fraction, it works.
            
            // Let's just use hours*3600 + min*60 + sec + fraction
            const fraction = parseFloat(`0.${msStr}`);
            return h * 3600 + m * 60 + s + fraction;
        } else {
             // Handle "4" case (precision 4) where it might be single digit representing 10s?
             // formatTimestamp(4) returns "HH:MM:S". "11:16:4".
             // If we parse "4" as seconds, it becomes 4s. But it meant 40s bucket.
             // BUT, for sorting, "11:16:4" vs "11:16:5". 4 < 5. Correct order.
             // So treating it as seconds for sorting value is fine as long as we compare consistent precisions.
             // But if we mix? The list is generated with SINGLE precision. So we compare items of SAME format.
             // So simple parsing is fine.
             s = parseInt(secStr, 10);
             return h * 3600 + m * 60 + s;
        }
    }
    
    return h * 3600 + m * 60 + s;
}
