import { type TraceLine, type TraceHeader, LineCode } from "../../trace-viewer-core/9-core-types";
import { TraceParser } from "../../trace-viewer-core/0-parser";

export interface ParsedTraceData {
    rawLines: TraceLine[];
    viewLines: TraceLine[];
    uniqueThreadIds: number[];
    header: TraceHeader;
    errorCount: number;
}

export async function asyncParseTraceFile(file: File): Promise<ParsedTraceData> {
    const arrayBuffer = await file.arrayBuffer();
    const parser = new TraceParser(arrayBuffer);
    
    // Offload parsing to avoid blocking UI? 
    // For now, sync. Ideally use Web Worker.
    parser.parse();

    const rawLines = parser.lines;
    
    const viewLines = parser.lines.filter((l: TraceLine) => l.code !== LineCode.Time);
    const uniqueThreadIds = Array.from(new Set(parser.lines.map((l: TraceLine) => l.threadId))).sort((a, b) => a - b);
    const errorCount = parser.lines.filter((l: TraceLine) => l.code === LineCode.Error).length;

    return {
        rawLines,
        viewLines,
        uniqueThreadIds,
        header: parser.header,
        errorCount,
    };
}
