import { proxy } from "valtio";
import type { TraceLine, TraceHeader } from "../../trace-viewer-core/types";
import { parseTraceFile } from "./1-parse-trace";

export interface TraceState {
    lines: TraceLine[]; // Use this for display (alias for viewLines)
    rawLines: TraceLine[]; // Contains all lines including Time, etc.
    viewLines: TraceLine[]; // Filtered lines for display
    uniqueThreadIds: number[];
    header: TraceHeader;
    fileName: string | null;
    isLoading: boolean;
    error: string | null;
    currentLineIndex: number;
    loadTrace: (file: File) => Promise<void>;
}

export const traceStore = proxy<TraceState>({
    lines: [],
    rawLines: [],
    viewLines: [],
    uniqueThreadIds: [],
    header: { magic: '' },
    fileName: null,
    isLoading: false,
    error: null,
    currentLineIndex: -1,
    loadTrace: async (file: File) => {
        traceStore.isLoading = true;
        traceStore.error = null;
        traceStore.fileName = file.name;
        traceStore.lines = [];
        traceStore.rawLines = [];
        traceStore.viewLines = [];
        traceStore.header = { magic: '' };

        try {
            const parsedData = await parseTraceFile(file);
            
            traceStore.rawLines = parsedData.rawLines;
            traceStore.viewLines = parsedData.viewLines;
            // Alias lines to viewLines for backward compatibility with components
            traceStore.lines = parsedData.viewLines;
            traceStore.uniqueThreadIds = parsedData.uniqueThreadIds;
            traceStore.header = parsedData.header;
        } catch (e: any) {
            console.error("Failed to load trace", e);
            traceStore.error = e.message || "Unknown error";
        } finally {
            traceStore.isLoading = false;
        }
    }
});

