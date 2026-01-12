import { proxy, subscribe } from "valtio";
import { notice } from "../../components/ui/local-ui/7-toaster";
import { appSettings } from "../1-ui-settings";
import { type TraceLine } from "../../trace-viewer-core/9-core-types";
import { type FileState, filesStore } from "./9-types-files-store";
import { type AllTimesItem } from "../../workers/all-times-worker-types";
import { asyncBuildAllTimesInWorker } from "../../workers-client/all-times-client";
import { selectionStore } from "./selection";

export interface TraceStore {
    // Current file
    currentFileState: FileState | null;         // Active file state (mirrored from selected file)

    // All times
    allTimes: AllTimesItem[];                          // All times items
    allTimesIsLoading: boolean;                        // Whether the all times is loading
    allTimesError: string | null;                      // Error message for the all times
    allTimesSelectedTimestamp: string | null;          // Timestamp of the selected item in the all times
    pendingScrollTimestamp: string | null;             // Timestamp to scroll TraceList to when the all times item is selected

    // Actions
    // loadTrace: (file: File) => Promise<void>;
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

    // loadTrace: async (file: File) => {
    //     const newFileState = newTraceItemCreate(file);
    //     await newTraceItemLoad(newFileState, file);

    //     filesStore.filesState.push(newFileState);

    //     traceStore.selectFile(newFileState.id); // Select it (this will update loading state in UI)

    //     // If this is still the selected file, update the top-level properties
    //     if (selectionStore.selectedFileId === newFileState.id) {
    //         const traceState = filesStore.filesState.find(f => f.id === newFileState.id);
    //         if (traceState) {
    //             traceStore.currentFileState = traceState;
    //         }
    //     }

    //     // Recompute filters and highlights for the new file
    //     recomputeFilterMatches();
    //     recomputeHighlightMatches();

    //     runBuildAlltimes();
    // },

    selectFile: (id: string | null) => {
        selectionStore.selectedFileId = id;

        if (id) {
            const fileState = filesStore.filesState.find(f => f.id === id);
            if (fileState) {
                traceStore.currentFileState = fileState;
            }
        } else {
            traceStore.currentFileState = null;
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

// Subscribe to currentLineIndex changes to update the file state
subscribe(traceStore,
    () => {
        if (selectionStore.selectedFileId && traceStore.currentFileState) {
            const file = filesStore.filesState.find(f => f.id === selectionStore.selectedFileId);
            // Only update if changed to avoid infinite loops if syncActiveFile triggers this
            if (file && file.currentLineIndex !== traceStore.currentFileState.currentLineIndex) {
                file.currentLineIndex = traceStore.currentFileState.currentLineIndex;
            }
        }
    }
);
