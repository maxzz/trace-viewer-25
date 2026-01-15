import { atom, getDefaultStore } from "jotai";
import { filesStore, type FileState } from "./9-types-files-store";

export const currentFileStateAtom = atom<FileState | null>(null);

// Atom that holds ID of the selected file.
// We use this to allow components to subscribe to selection changes efficiently (using selectAtom),
// avoiding re-renders of the whole list when selection changes.
export const selectedFileIdAtom = atom(
    (get) => get(currentFileStateAtom)?.id ?? null
);

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
        getDefaultStore().set(state.currentLineIdxAtom, lineIndex);
    }
}
