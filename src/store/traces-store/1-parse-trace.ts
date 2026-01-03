import { TraceParser } from "../../trace-viewer-core/parser";
import type { TraceLine, TraceHeader } from "../../trace-viewer-core/types";

export interface ParsedTraceData {
    rawLines: TraceLine[];
    viewLines: TraceLine[];
    uniqueThreadIds: number[];
    header: TraceHeader;
}

export async function parseTraceFile(file: File): Promise<ParsedTraceData> {
    const arrayBuffer = await file.arrayBuffer();
    const parser = new TraceParser(arrayBuffer);
    
    // Offload parsing to avoid blocking UI? 
    // For now, sync. Ideally use Web Worker.
    parser.parse();

    const rawLines = parser.lines;
    // Filter out Time lines (84) for default view
    const viewLines = parser.lines.filter(l => l.code !== 84);
    const uniqueThreadIds = Array.from(new Set(parser.lines.map(l => l.threadId))).sort((a, b) => a - b);

    return {
        rawLines,
        viewLines,
        uniqueThreadIds,
        header: parser.header,
    };
}
