import { atom, getDefaultStore } from "jotai";
import { filesStore, type FileState } from "./9-types-files-store";

export const currentFileStateAtom = atom<FileState | null>(null);

// Helper functions for accessing the atom outside of React components

export function getCurrentFileState(): FileState | null {
    return getDefaultStore().get(currentFileStateAtom);
}

export function setCurrentFileState(fileState: FileState | null): void {
    getDefaultStore().set(currentFileStateAtom, fileState);
}

export function setCurrentLineIndex(lineIndex: number): void {
    const state = getDefaultStore().get(currentFileStateAtom);
    if (state) {
        const newState = { ...state, currentLineIndex: lineIndex };

        // Update the main store to ensure consistency
        const index = filesStore.states.findIndex(f => f.id === state.id);
        if (index !== -1) {
            filesStore.states[index] = newState as FileState;
            // Use the proxy from the store to maintain specific object identity characteristics if any
            getDefaultStore().set(currentFileStateAtom, filesStore.states[index]);
        } else {
            // Fallback if not found in store (should theoretically not happen for active file)
            getDefaultStore().set(currentFileStateAtom, newState as FileState);
        }
    }
}
