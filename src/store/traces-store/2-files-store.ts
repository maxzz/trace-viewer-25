import { proxy } from "valtio";
import { type TraceLine, type TraceHeader } from "../../trace-viewer-core/9-core-types";

export interface TraceFile {
    id: string;
    fileName: string;
    rawLines: TraceLine[];
    viewLines: TraceLine[];
    lines: TraceLine[]; // Alias for viewLines
    uniqueThreadIds: number[];
    header: TraceHeader;
    errorCount: number;
    isLoading: boolean;
    error: string | null;
    currentLineIndex: number;
    matchedFilterIds: string[]; // Cache for FILTERS that match this file (for hiding)
    matchedHighlightIds: string[]; // Cache for HIGHLIGHT rules that match this file (for coloring)
}

export interface FilesState {
    traceFiles: TraceFile[];
}

export const filesStore = proxy<FilesState>({
    traceFiles: [],
});
