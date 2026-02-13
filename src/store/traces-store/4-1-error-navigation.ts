import { atom } from "jotai";
import { appSettings } from "@/store/1-ui-settings";
import { currentFileStateAtom } from "@/store/traces-store/0-files-current-state";
import { LineCode } from "@/trace-viewer-core/9-core-types";
import { currentFileSelectedThreadIdAtom, setCurrentFileShowOnlySelectedThreadAtom, syncCurrentFileThreadLinesCacheAtom } from "@/store/traces-store/2-thread-filter-cache";

type ErrorsNavigationWrapDialogState = {
    direction: "prev" | "next";
    targetBaseIndex: number;
} | null;

export const currentFileErrorBaseIndicesAtom = atom(
    (get) => {
        const fileState = get(currentFileStateAtom);
        if (!fileState) return [];

        const viewLines = fileState.data.viewLines;
        const errors: number[] = [];
        for (let i = 0; i < viewLines.length; i++) {
            if (viewLines[i]?.code === LineCode.Error) {
                errors.push(i);
            }
        }
        return errors;
    }
);

export const currentFileErrorsNavPositionAtom = atom(
    (get) => {
        const fileState = get(currentFileStateAtom);
        const errors = get(currentFileErrorBaseIndicesAtom);
        const total = errors.length;
        if (!fileState || total === 0) {
            return { current: 0, total };
        }

        const currentLineIndex = get(fileState.currentLineIdxAtom);
        const idx = errors.indexOf(currentLineIndex);
        return { current: idx >= 0 ? idx + 1 : 0, total };
    }
);

export const errorsNavigationWrapDialogAtom = atom<ErrorsNavigationWrapDialogState>(null);

export const cancelErrorsNavigationWrapDialogAtom = atom(
    null,
    (_get, set) => {
        set(errorsNavigationWrapDialogAtom, null);
    }
);

export const confirmErrorsNavigationWrapDialogAtom = atom(
    null,
    (get, set) => {
        const dialog = get(errorsNavigationWrapDialogAtom);
        if (!dialog) return;
        set(errorsNavigationWrapDialogAtom, null);
        set(selectErrorBaseIndexAtom, dialog.targetBaseIndex);
    }
);

export const goToNextErrorAtom = atom(
    null,
    (get, set) => {
        const fileState = get(currentFileStateAtom);
        if (!fileState) return;

        const errors = get(currentFileErrorBaseIndicesAtom);
        if (errors.length === 0) return;

        const currentLineIndex = get(fileState.currentLineIdxAtom);
        const nextIndex = findNextErrorBaseIndex(errors, currentLineIndex);
        if (nextIndex !== null) {
            set(selectErrorBaseIndexAtom, nextIndex);
            return;
        }

        const target = errors[0]!;
        if (!appSettings.showErrorsNavigationWrapDialog) {
            set(selectErrorBaseIndexAtom, target);
            return;
        }

        set(errorsNavigationWrapDialogAtom, { direction: "next", targetBaseIndex: target });
    }
);

export const goToPrevErrorAtom = atom(
    null,
    (get, set) => {
        const fileState = get(currentFileStateAtom);
        if (!fileState) return;

        const errors = get(currentFileErrorBaseIndicesAtom);
        if (errors.length === 0) return;

        const currentLineIndex = get(fileState.currentLineIdxAtom);
        const prevIndex = findPrevErrorBaseIndex(errors, currentLineIndex);
        if (prevIndex !== null) {
            set(selectErrorBaseIndexAtom, prevIndex);
            return;
        }

        const target = errors[errors.length - 1]!;
        if (!appSettings.showErrorsNavigationWrapDialog) {
            set(selectErrorBaseIndexAtom, target);
            return;
        }

        set(errorsNavigationWrapDialogAtom, { direction: "prev", targetBaseIndex: target });
    }
);

const selectErrorBaseIndexAtom = atom(
    null,
    (get, set, baseIndex: number) => {
        const fileState = get(currentFileStateAtom);
        if (!fileState) return;

        const viewedThreadId = get(currentFileSelectedThreadIdAtom);
        const showOnlySelectedThreadEnabled = get(fileState.showOnlySelectedThreadAtom);
        const lineThreadId = fileState.data.viewLines[baseIndex]?.threadId;
        if (showOnlySelectedThreadEnabled && viewedThreadId !== null && lineThreadId !== undefined && lineThreadId !== viewedThreadId) {
            set(setCurrentFileShowOnlySelectedThreadAtom, false);
        }

        set(fileState.currentLineIdxAtom, baseIndex);
        set(syncCurrentFileThreadLinesCacheAtom, "sync");
    }
);

function findNextErrorBaseIndex(errors: readonly number[], currentLineIndex: number) {
    const isUnset = currentLineIndex < 0;
    if (isUnset) return errors[0] ?? null;

    for (const idx of errors) {
        if (idx > currentLineIndex) return idx;
    }
    return null;
}

function findPrevErrorBaseIndex(errors: readonly number[], currentLineIndex: number) {
    const isUnset = currentLineIndex < 0;
    if (isUnset) return errors[errors.length - 1] ?? null;

    for (let i = errors.length - 1; i >= 0; i--) {
        const idx = errors[i]!;
        if (idx < currentLineIndex) return idx;
    }
    return null;
}

