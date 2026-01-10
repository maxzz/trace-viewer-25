import { type HighlightRule, appSettings } from './1-ui-settings';
import { filesStore } from './traces-store/2-files-store';
import { isFileNameMatch } from '@/utils/filter-match';

// Use this for HIGHLIGHTING (Coloring files)
export function recomputeHighlightMatches() {
    const rules = appSettings.highlightRules;
    const files = filesStore.traceFiles;

    if (files.length === 0) return;

    files.forEach(file => {
        const matchedIds: string[] = [];
        rules.forEach(rule => {
            if (isFileNameMatch(file.fileName, rule.pattern)) {
                matchedIds.push(rule.id);
            }
        });
        
        // Update only if changed to avoid unnecessary renders
        if (JSON.stringify(file.matchedHighlightIds) !== JSON.stringify(matchedIds)) {
            file.matchedHighlightIds = matchedIds;
        }
    });
}

export const highlightActions = {
    addRule: (name: string, pattern: string, color?: string) => {
        const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
        appSettings.highlightRules.push({ id, name, pattern, color });
        recomputeHighlightMatches();
    },

    deleteRule: (id: string) => {
        const index = appSettings.highlightRules.findIndex(f => f.id === id);
        if (index !== -1) {
            appSettings.highlightRules.splice(index, 1);
        }
        recomputeHighlightMatches();
    },

    updateRule: (id: string, updates: Partial<Omit<HighlightRule, 'id'>>) => {
        const rule = appSettings.highlightRules.find(f => f.id === id);
        if (rule) {
            Object.assign(rule, updates);
            // Recompute if pattern changed
            if (updates.pattern !== undefined) {
                recomputeHighlightMatches();
            }
        }
    },

    reorderRules: (newOrder: HighlightRule[]) => {
        appSettings.highlightRules = newOrder;
        // The order of rules matters for which color takes precedence if we implement "first match wins"
        // But for matchedHighlightIds, it's just a list. The UI logic handles precedence.
    },

    toggleHighlight: () => {
        appSettings.highlightEnabled = !appSettings.highlightEnabled;
    }
};
