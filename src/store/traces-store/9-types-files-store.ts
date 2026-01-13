import { proxy } from "valtio";
import { type TraceLine, type TraceHeader } from "../../trace-viewer-core/9-core-types";

export interface FileData  {
    id: string;
    
    fileName: string;
    rawLines: TraceLine[];
    viewLines: TraceLine[];
    uniqueThreadIds: number[];
    header: TraceHeader;
    errorsInTraceCount: number;                 // Count of lines with code === LineCode.Error.
    
    isLoading: boolean;
    errorLoadingFile: string | null;            // Error message from loading the file.
}

export interface FileState {
    id: string;
    data: FileData;
    
    currentLineIndex: number;
    matchedFilterIds: string[];                 // Cache for FILTERS that match this file (for hiding).
    matchedHighlightIds: string[];              // Cache for HIGHLIGHT rules that match this file (for coloring).
}

// Store

interface FilesStore {
    quickFileData: Record<string, FileData>;    // Quick File Data accessed by ID.
    states: FileState[];                        // All files state.
}

export const filesStore = proxy<FilesStore>({
    quickFileData: {},
    states: [],
});
