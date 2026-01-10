import { proxy } from "valtio";
import { type TraceLine, type TraceHeader } from "../../trace-viewer-core/9-core-types";
import { type PrimitiveAtom } from "jotai";

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
    
    currentLineIndexAtom: PrimitiveAtom<number>;
    matchedFilterIdsAtom: PrimitiveAtom<string[]>;
    matchedHighlightIdsAtom: PrimitiveAtom<string[]>;
}

export interface FilesState {
    traceFiles: TraceFile[];
}

export const filesStore = proxy<FilesState>({
    traceFiles: [],
});
