import { atom } from 'jotai';
import { atomEffect } from 'jotai-effect';
import { atomWithProxy } from 'jotai-valtio';
import { appSettings, type FileFilter } from './1-ui-settings';
import { filesStore, type FileState } from './traces-store/9-types-files-store';
import { selectionStore } from './traces-store/selection';
import { traceStore } from './traces-store/0-state';

// Atoms to track valtio state changes
const filesStatesAtom = atomWithProxy(filesStore);
const appSettingsAtom = atomWithProxy(appSettings);
const selectionStoreAtom = atomWithProxy(selectionStore);

// Derived atom for filtered files
export const filteredFilesAtom = atom(
    (get) => {
        const { states } = get(filesStatesAtom);
        const { fileFilters, selectedFilterId } = get(appSettingsAtom);
        return filterFiles(states, selectedFilterId, fileFilters);
    }
);

// Derived atom for files count
export const filesCountAtom = atom(
    (get) => {
        const { states } = get(filesStatesAtom);
        return states.length;
    }
);

function filterFiles(files: readonly FileState[], selectedFilterId: string | null, fileFilters: readonly FileFilter[]): readonly FileState[] {
    const filter = !selectedFilterId ? null : fileFilters.find(f => f.id === selectedFilterId);
    if (!filter) {
        return files;
    }

    const pattern = filter.pattern;

    // Check if pattern is regex (starts and ends with /)
    if (pattern.startsWith('/') && pattern.endsWith('/') && pattern.length > 1) {
        try {
            const regexPattern = pattern.slice(1, -1);
            const regex = new RegExp(regexPattern, 'i');
            return files.filter((file) => regex.test(file.data.fileName));
        } catch (e) {
            // Invalid regex, return empty or fallback
            console.warn('Invalid regex pattern:', pattern, e);
            return [];
        }
    }

    // Non-regex pattern: use existing logic
    const patternLower = pattern.toLowerCase();

    // Convert glob to regex if contains *
    if (patternLower.includes('*')) {
        try {
            const regexStr = "^" + patternLower.split('*').map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + "$";
            const regex = new RegExp(regexStr, 'i');
            return files.filter((file) => regex.test(file.data.fileName));
        } catch (e) {
            // fallback to contains
            return files.filter((file) => file.data.fileName.toLowerCase().includes(patternLower.replace(/\*/g, '')));
        }
    }

    return files.filter(file => file.data.fileName.toLowerCase().includes(patternLower));
}

// Effect atom to handle selection change when filter results change
export const filteredFilesSelectionEffectAtom = atomEffect(
    (get) => {
        const { states } = get(filesStatesAtom);
        const { selectedFileId } = get(selectionStoreAtom);
        const filteredFiles = get(filteredFilesAtom);

        if (states.length === 0) return;

        // Check if currently selected file is in the filtered list
        const isSelectedInFiltered = filteredFiles.some(f => f.id === selectedFileId);

        if (!isSelectedInFiltered) {
            if (filteredFiles.length > 0) {
                // Select first file if current selection is hidden
                traceStore.selectFile(filteredFiles[0].id);
            } else if (selectedFileId) {
                // Deselect if no files match filter
                traceStore.selectFile(null);
            }
        }
    }
);
