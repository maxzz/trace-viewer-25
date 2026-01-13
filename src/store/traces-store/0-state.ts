import { proxy, subscribe } from "valtio";
import { type FileState, filesStore } from "./9-types-files-store";
import { selectionStore } from "./selection";

export interface TraceStore {
    // Current file
    currentFileState: FileState | null;         // Active file state (mirrored from selected file)

    // Actions
    selectFile: (id: string | null) => void;
    closeFile: (id: string) => void;
    closeOtherFiles: (id: string) => void;
    closeAllFiles: () => void;
}

export const traceStore = proxy<TraceStore>({
    // Initial empty state
    currentFileState: null,

    selectFile: (id: string | null) => {
        selectionStore.selectedFileId = id;

        if (id) {
            const fileState = filesStore.states.find(f => f.id === id);
            if (fileState) {
                traceStore.currentFileState = fileState;
            }
        } else {
            traceStore.currentFileState = null;
        }
    },

    closeFile: (id: string) => {
        const index = filesStore.states.findIndex(f => f.id === id);
        if (index !== -1) {
            filesStore.states.splice(index, 1);
            delete filesStore.quickFileData[id];

            // If closed file was selected, select another one
            if (selectionStore.selectedFileId === id) {
                if (filesStore.states.length > 0) {
                    // Select the next file, or the previous one if we closed the last one
                    const nextIndex = Math.min(index, filesStore.states.length - 1);
                    traceStore.selectFile(filesStore.states[nextIndex].id);
                } else {
                    traceStore.selectFile(null);
                }
            }
        }
    },

    closeOtherFiles: (id: string) => {
        filesStore.states = filesStore.states.filter(f => f.id === id);
        const keys = Object.keys(filesStore.quickFileData);
        keys.forEach(key => {
            if (key !== id) {
                delete filesStore.quickFileData[key];
            }
        });

        if (selectionStore.selectedFileId !== id) {
            traceStore.selectFile(id);
        }
    },

    closeAllFiles: () => {
        filesStore.states = [];
        filesStore.quickFileData = {};
        traceStore.selectFile(null);
    },
});

// Subscribe to currentLineIndex changes to update the file state
subscribe(traceStore,
    () => {
        if (selectionStore.selectedFileId && traceStore.currentFileState) {
            const fileState = filesStore.states.find(f => f.id === selectionStore.selectedFileId);
            // Only update if changed to avoid infinite loops if syncActiveFile triggers this
            if (fileState && fileState.currentLineIndex !== traceStore.currentFileState.currentLineIndex) {
                fileState.currentLineIndex = traceStore.currentFileState.currentLineIndex;
            }
        }
    }
);
