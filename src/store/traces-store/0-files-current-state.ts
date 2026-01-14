import { proxy, subscribe } from "valtio";
import { type FileState, filesStore } from "./9-types-files-store";
import { fileListStore } from "./0-files-list-selection";

export interface TraceStore {
    // Current file
    currentFileState: FileState | null;         // Active file state (mirrored from selected file)
}

export const traceStore = proxy<TraceStore>({
    currentFileState: null,
});

// Subscribe to currentLineIndex changes to update the file state
subscribe(traceStore,
    () => {
        if (fileListStore.selectedFileId && traceStore.currentFileState) {
            const fileState = filesStore.states.find(f => f.id === fileListStore.selectedFileId);
            // Only update if changed to avoid infinite loops if syncActiveFile triggers this
            if (fileState && fileState.currentLineIndex !== traceStore.currentFileState.currentLineIndex) {
                fileState.currentLineIndex = traceStore.currentFileState.currentLineIndex;
            }
        }
    }
);
