import { filesStore } from "./9-types-files-store";
import { fileListStore } from "./0-files-list-selection";
import { traceStore } from "./0-files-current-state";

export function selectFile(id: string | null) {
    fileListStore.selectedFileId = id;

    if (id) {
        const fileState = filesStore.states.find(f => f.id === id);
        if (fileState) {
            traceStore.currentFileState = fileState;
        }
    } else {
        traceStore.currentFileState = null;
    }
}

export function closeFile(id: string) {
    const index = filesStore.states.findIndex(f => f.id === id);
    if (index !== -1) {
        filesStore.states.splice(index, 1);
        delete filesStore.quickFileData[id];

        // If closed file was selected, select another one
        if (fileListStore.selectedFileId === id) {
            if (filesStore.states.length > 0) {
                // Select the next file, or the previous one if we closed the last one
                const nextIndex = Math.min(index, filesStore.states.length - 1);
                selectFile(filesStore.states[nextIndex].id);
            } else {
                selectFile(null);
            }
        }
    }
}

export function closeOtherFiles(id: string) {
    filesStore.states = filesStore.states.filter(f => f.id === id);
    const keys = Object.keys(filesStore.quickFileData);
    keys.forEach(key => {
        if (key !== id) {
            delete filesStore.quickFileData[key];
        }
    });

    if (fileListStore.selectedFileId !== id) {
        selectFile(id);
    }
}

export function closeAllFiles() {
    filesStore.states = [];
    filesStore.quickFileData = {};
    selectFile(null);
}
