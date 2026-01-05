import { type FileFilter, appSettings } from './1-ui-settings';

export const filterActions = {
    addFilter: (name: string, pattern: string) => {
        const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
        appSettings.fileFilters.push({ id, name, pattern });
        // Auto-select the new filter if it's the first one? No, maybe not.
    },

    deleteFilter: (id: string) => {
        const index = appSettings.fileFilters.findIndex(f => f.id === id);
        if (index !== -1) {
            appSettings.fileFilters.splice(index, 1);
        }
        if (appSettings.selectedFilterId === id) {
            appSettings.selectedFilterId = null;
        }
    },

    updateFilter: (id: string, updates: Partial<Omit<FileFilter, 'id'>>) => {
        const filter = appSettings.fileFilters.find(f => f.id === id);
        if (filter) {
            Object.assign(filter, updates);
        }
    },

    reorderFilters: (newOrder: FileFilter[]) => {
        appSettings.fileFilters = newOrder;
    },

    selectFilter: (id: string | null) => {
        appSettings.selectedFilterId = id;
    }
};
