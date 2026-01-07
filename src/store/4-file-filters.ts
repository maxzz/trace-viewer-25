import { type FileFilter, appSettings } from './1-ui-settings';
import { traceStore } from './traces-store/0-state';
import { isFileNameMatch } from '@/utils/filter-match';

// Use this for FILTERING (Hiding files)
export function recomputeFilterMatches() {
    const filters = appSettings.fileFilters;
    const files = traceStore.files;

    if (files.length === 0) return;

    files.forEach(file => {
        const matchedIds: string[] = [];
        filters.forEach(filter => {
            if (isFileNameMatch(file.fileName, filter.pattern)) {
                matchedIds.push(filter.id);
            }
        });
        
        // Update only if changed to avoid unnecessary renders
        if (JSON.stringify(file.matchedFilterIds) !== JSON.stringify(matchedIds)) {
            file.matchedFilterIds = matchedIds;
        }
    });
}

export const filterActions = {
    addFilter: (name: string, pattern: string) => {
        const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
        appSettings.fileFilters.push({ id, name, pattern });
        recomputeFilterMatches();
    },

    deleteFilter: (id: string) => {
        const index = appSettings.fileFilters.findIndex(f => f.id === id);
        if (index !== -1) {
            appSettings.fileFilters.splice(index, 1);
        }
        if (appSettings.selectedFilterId === id) {
            appSettings.selectedFilterId = null;
        }
        recomputeFilterMatches();
    },

    updateFilter: (id: string, updates: Partial<Omit<FileFilter, 'id'>>) => {
        const filter = appSettings.fileFilters.find(f => f.id === id);
        if (filter) {
            Object.assign(filter, updates);
            // Only recompute if pattern changed
            if (updates.pattern !== undefined) {
                recomputeFilterMatches();
            }
        }
    },

    reorderFilters: (newOrder: FileFilter[]) => {
        appSettings.fileFilters = newOrder;
    },

    selectFilter: (id: string | null) => {
        appSettings.selectedFilterId = id;
    }
};
