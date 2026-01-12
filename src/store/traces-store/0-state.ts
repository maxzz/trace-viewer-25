import { proxy, ref, subscribe } from "valtio";
import { notice } from "../../components/ui/local-ui/7-toaster";
import { appSettings } from "../1-ui-settings";
import { type TraceLine, type TraceHeader, emptyFileHeader } from "../../trace-viewer-core/9-core-types";
import { type FileState, type FileData, filesStore } from "./9-types-files-store";
import { type AllTimesItem } from "../../workers/all-times-worker-types";
import { asyncParseTraceFile } from "./2-parse-trace-file";
import { asyncBuildAllTimesInWorker } from "../../workers-client/all-times-client";
import { recomputeFilterMatches } from "../4-file-filters";
import { recomputeHighlightMatches } from "../5-highlight-rules";
import { runBuildAlltimes } from "./8-all-times-listener";
import { selectionStore } from "./selection";

export interface FileUiState {
    currentLineIndex: number;                          // Line index in the trace view of the current file
}

export interface CurrentFileState {
    fileData: FileData;
    fileState: FileUiState;
}

export interface TraceStore {
    // Current file
    currentFileState: CurrentFileState | null;         // Active file state (mirrored from selected file)

    // All times
    allTimes: AllTimesItem[];                          // All times items
    allTimesIsLoading: boolean;                        // Whether the all times is loading
    allTimesError: string | null;                      // Error message for the all times
    allTimesSelectedTimestamp: string | null;          // Timestamp of the selected item in the all times
    pendingScrollTimestamp: string | null;             // Timestamp to scroll TraceList to when the all times item is selected

    // Actions
    loadTrace: (file: File) => Promise<void>;
    selectFile: (id: string | null) => void;
    closeFile: (id: string) => void;
    closeOtherFiles: (id: string) => void;
    closeAllFiles: () => void;
    setAllTimes: (items: AllTimesItem[]) => void;
    setAllTimesLoading: (loading: boolean) => void;
    setAllTimesSelectedTimestamp: (timestamp: string | null) => void;
    setPendingScrollTimestamp: (timestamp: string | null) => void;
    asyncBuildAllTimes: (precision: number) => Promise<void>;
}

export const traceStore = proxy<TraceStore>({
    // Initial empty state
    currentFileState: null,

    // Timeline
    allTimes: [],
    allTimesIsLoading: false,
    allTimesError: null,
    allTimesSelectedTimestamp: null,
    pendingScrollTimestamp: null,

    loadTrace: async (file: File) => {
        const id = MakeUuid();
        const newFileData = createNewFileData(id, file.name);
        const newFile = createNewFileState(id, newFileData);

        filesStore.filesData[id] = ref(newFileData); // Add to store immediately
        newFile.data = filesStore.filesData[id]; // Update reference to point to the proxy in the store
        filesStore.filesState.push(newFile);

        traceStore.selectFile(id); // Select it (this will update loading state in UI)

        try {
            const parsedData = await asyncParseTraceFile(file);

            // Find the file data in store
            if (filesStore.filesData[id]) {
                const updatedFileData = filesStore.filesData[id];
                updatedFileData.rawLines = parsedData.rawLines;
                updatedFileData.viewLines = parsedData.viewLines;
                updatedFileData.uniqueThreadIds = parsedData.uniqueThreadIds;
                updatedFileData.header = parsedData.header;
                updatedFileData.errorCount = parsedData.errorCount;
                updatedFileData.isLoading = false;

                // If this is still the selected file, update the top-level properties
                if (selectionStore.selectedFileId === id) {
                    const traceFile = filesStore.filesState.find(f => f.id === id);
                    if (traceFile) {
                        syncToSetAsActiveFile(traceFile);
                    }
                }
                
                // Recompute filters and highlights for the new file
                recomputeFilterMatches();
                recomputeHighlightMatches();
            }
        } catch (e: any) {
            console.error("Failed to load trace", e);
            if (filesStore.filesData[id]) {
                filesStore.filesData[id].errorLoadingFile = e.message || "Unknown error";
                filesStore.filesData[id].isLoading = false;
                
                if (selectionStore.selectedFileId === id) {
                    if (traceStore.currentFileState) {
                        traceStore.currentFileState.fileData.errorLoadingFile = filesStore.filesData[id].errorLoadingFile;
                        traceStore.currentFileState.fileData.isLoading = false;
                    }
                }
            }
        } finally {
            runBuildAlltimes();
        }

    },

    selectFile: (id: string | null) => {
        selectionStore.selectedFileId = id;

        if (id) {
            const file = filesStore.filesState.find(f => f.id === id);
            if (file) {
                syncToSetAsActiveFile(file);
            }
        } else {
            resetTraceStoreToEmpty();
        }
    },

    closeFile: (id: string) => {
        const index = filesStore.filesState.findIndex(f => f.id === id);
        if (index !== -1) {
            filesStore.filesState.splice(index, 1);
            delete filesStore.filesData[id];

            // If closed file was selected, select another one
            if (selectionStore.selectedFileId === id) {
                if (filesStore.filesState.length > 0) {
                    // Select the next file, or the previous one if we closed the last one
                    const nextIndex = Math.min(index, filesStore.filesState.length - 1);
                    traceStore.selectFile(filesStore.filesState[nextIndex].id);
                } else {
                    traceStore.selectFile(null);
                }
            }
        }
    },

    closeOtherFiles: (id: string) => {
        filesStore.filesState = filesStore.filesState.filter(f => f.id === id);
        const keys = Object.keys(filesStore.filesData);
        keys.forEach(key => {
            if (key !== id) {
                delete filesStore.filesData[key];
            }
        });
        
        if (selectionStore.selectedFileId !== id) {
            traceStore.selectFile(id);
        }
    },

    closeAllFiles: () => {
        filesStore.filesState = [];
        filesStore.filesData = {};
        traceStore.selectFile(null);
    },

    setAllTimes: (items: AllTimesItem[]) => {
        traceStore.allTimes = items;
        traceStore.allTimesIsLoading = false;
        traceStore.allTimesError = null;
    },

    setAllTimesLoading: (loading: boolean) => {
        traceStore.allTimesIsLoading = loading;
        if (loading) {
            traceStore.allTimesError = null;
        }
    },

    setAllTimesSelectedTimestamp: (timestamp: string | null) => {
        traceStore.allTimesSelectedTimestamp = timestamp;
    },

    setPendingScrollTimestamp: (timestamp: string | null) => {
        traceStore.pendingScrollTimestamp = timestamp;
    },

    asyncBuildAllTimes: async (precision: number) => {
        traceStore.setAllTimesLoading(true);
        try {
            const inputFiles = filesStore.filesState.map(
                (f: FileState) => ({
                    id: f.id,
                    lines: f.data.viewLines.map(
                        (l: TraceLine) => ({ timestamp: l.timestamp, lineIndex: l.lineIndex, date: l.date })
                    )
                })
            );

            const items = await asyncBuildAllTimesInWorker(inputFiles, precision);
            traceStore.setAllTimes(items);
            if (appSettings.allTimes.showBuildDoneNotice) {
                notice.success("Timeline built");
            }
        } catch (e: any) {
            if (e.message === 'Timeline build cancelled') {
                // unexpected here unless we cancelled it
                notice.info("Timeline build cancelled");
            } else {
                console.error("Timeline build failed", e);
                traceStore.setAllTimesLoading(false); // Make sure to stop loading
                notice.error(`Timeline build failed: ${e.message}`);
            }
        }
    }
});

// Utilities

function MakeUuid(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function createNewFileData(id: string, fileName: string): FileData {
    return {
        id,
        fileName,
        rawLines: [],
        viewLines: [],
        uniqueThreadIds: [],
        header: emptyFileHeader,
        errorCount: 0,
        isLoading: true,
        errorLoadingFile: null,
    };
}

function createNewFileState(id: string, data: FileData): FileState {
    return {
        id,
        data, // Placeholder, will update after adding to store
        currentLineIndex: -1,
        matchedFilterIds: [],
        matchedHighlightIds: []
    };
}
function resetTraceStoreToEmpty() {
    traceStore.currentFileState = null;
}

function syncToSetAsActiveFile(file: FileState) {
    traceStore.currentFileState = {
        fileData: file.data,
        fileState: {
            currentLineIndex: file.currentLineIndex
        }
    };
}

// Subscribe to currentLineIndex changes to update the file state
subscribe(traceStore,
    () => {
        if (selectionStore.selectedFileId && traceStore.currentFileState) {
            const file = filesStore.filesState.find(f => f.id === selectionStore.selectedFileId);
            // Only update if changed to avoid infinite loops if syncActiveFile triggers this
            if (file && file.currentLineIndex !== traceStore.currentFileState.fileState.currentLineIndex) {
                file.currentLineIndex = traceStore.currentFileState.fileState.currentLineIndex;
            }
        }
    }
);

