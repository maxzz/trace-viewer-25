import { atom, getDefaultStore } from "jotai";
import { type FileState } from "./9-types-files-store";

export const currentFileStateAtom = atom<FileState | null>(null);

// Helper functions for accessing the atom outside of React components

export function getCurrentFileState(): FileState | null {
    return getDefaultStore().get(currentFileStateAtom);
}

export function setCurrentFileState(fileState: FileState | null): void {
    getDefaultStore().set(currentFileStateAtom, fileState);
}
