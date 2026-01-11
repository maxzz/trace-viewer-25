import { proxy } from "valtio";
import { type TraceLine, type TraceHeader } from "../../trace-viewer-core/9-core-types";

export interface FileData  {
    id: string;
    
    fileName: string;
    rawLines: TraceLine[];
    viewLines: TraceLine[];
    uniqueThreadIds: number[];
    header: TraceHeader;
    errorCount: number;
    
    isLoading: boolean;
    errorLoadingFile: string | null;
}

export interface FileState {
    id: string;
    data: FileData;
    
    currentLineIndex: number;
    matchedFilterIds: string[]; // Cache for FILTERS that match this file (for hiding)
    matchedHighlightIds: string[]; // Cache for HIGHLIGHT rules that match this file (for coloring)
}

// Store

interface FilesStore {
    filesData: Record<string, FileData>;
    filesState: FileState[];
}

export const filesStore = proxy<FilesStore>({
    filesData: {},
    filesState: [],
});
