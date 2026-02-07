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
    
    isLoading: boolean;                         // This is non-reactive, but we use it to track if the file is loading.
    errorLoadingFile: string | null;            // Error message from loading the file.
}

export interface FileState {
    id: string;
    data: FileData;
    
    currentLineIdxAtom: PA<number>;             // current line index in the trace file. -1 if no line is selected.
    showOnlySelectedThreadAtom: PA<boolean>;    // show only selected thread lines in the trace list.
    threadLinesAtom: PA<TraceLine[] | undefined>;                  // cached thread-only lines for the trace list.
    threadLineBaseIndicesAtom: PA<number[] | undefined>;           // displayIndex -> baseIndex (index in data.viewLines).
    threadBaseIndexToDisplayIndexAtom: PA<number[] | undefined>;   // baseIndex -> displayIndex.
    threadLinesThreadIdAtom: PA<number | null>;                    // threadId the cache was built for.
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
