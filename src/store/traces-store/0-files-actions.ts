import { filesStore } from "./9-types-files-store";
import { getCurrentFileState, setCurrentFileState } from "./0-files-current-state";
import { removeFileLoadingAtom } from "./1-3-file-loading-atoms";

export function selectFile(id: string | null) {
    if (id) {
        const fileState = filesStore.states.find(f => f.id === id);
        if (fileState) {
            setCurrentFileState(fileState);
        }
    } else {
        setCurrentFileState(null);
    }
}

export function closeFile(id: string) {
    const index = filesStore.states.findIndex(f => f.id === id);
    if (index !== -1) {
        filesStore.states.splice(index, 1);
        delete filesStore.quickFileData[id];
        removeFileLoadingAtom(id);

        // If closed file was selected, select another one
        if (getCurrentFileState()?.id === id) {
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
    // Clean up loading atoms for files being closed
    filesStore.states.forEach(f => {
        if (f.id !== id) {
            removeFileLoadingAtom(f.id);
        }
    });

    filesStore.states = filesStore.states.filter(f => f.id === id);
    const keys = Object.keys(filesStore.quickFileData);
    keys.forEach(key => {
        if (key !== id) {
            delete filesStore.quickFileData[key];
        }
    });

    if (getCurrentFileState()?.id !== id) {
        selectFile(id);
    }
}

export function closeAllFiles() {
    // Clean up all loading atoms
    filesStore.states.forEach(f => removeFileLoadingAtom(f.id));

    filesStore.states = [];
    filesStore.quickFileData = {};
    selectFile(null);
}
