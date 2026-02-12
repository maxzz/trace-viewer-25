import { proxy, subscribe } from 'valtio';
import { type ThemeMode, themeApplyMode } from '../utils/theme-apply';

const STORE_KEY = "trace-viewer-25";
const STORE_VER = "v1.1"; // updated HighlightRule format
const STORAGE_ID = `${STORE_KEY}__${STORE_VER}`;

export interface FileFilter {
    id: string;
    name: string;
    pattern: string;
}

export interface HighlightRule {
    id: string;                 // Unique identifier for the rule
    rulePattern: string;        // Pattern to match file (wildcard or regex like file filters)
    overlayKey: string;         // This key from COLOR_GRID_Classes to get  the Tailwind overlay classes (e.g. "bg-red-500 opacity-20")
    ruleEnabled: boolean;       // Whether the rule is enabled
}

export interface AppSettings {
    showFooter: boolean;
    useIconsForEntryExit: boolean;
    showLineNumbers: boolean;
    theme: ThemeMode;
    panelSizes?: number[];      // ResizablePanelGroup panel sizes (percentages)
    extraInFooter: boolean;     // Show header info (Computer, OS, Compiled) in footer
    showOnlyErrorsInSelectedFile: boolean;
    
    // File Filters (Hiding files)
    fileFilters: FileFilter[];
    selectedFilterId: string | null;

    // Highlight Rules (Coloring files)
    highlightRules: HighlightRule[];
    highlightEnabled: boolean;

    // Navigation
    historyLimit: number;

    // Startup
    startupFilePattern: string; // Pattern to match file on startup (wildcard or regex like file filters)

    // All Times
    allTimes: {
        show: boolean;
        onLeft: boolean;
        precision: number;      // 0-5 digits to hide/round
        showBuildDoneNotice: boolean;
        needToRebuild: boolean;
    };
}

const DEFAULT_SETTINGS: AppSettings = {
    showFooter: true,
    useIconsForEntryExit: true,
    showLineNumbers: true,
    theme: 'light',
    extraInFooter: false,
    showOnlyErrorsInSelectedFile: false,
    fileFilters: [],
    selectedFilterId: null,
    highlightRules: [],
    highlightEnabled: true,
    historyLimit: 100,
    startupFilePattern: '',
    allTimes: {
        show: false,
        onLeft: true,
        precision: 2,
        showBuildDoneNotice: true,
        needToRebuild: true,
    },
};

// Load settings from localStorage

function loadSettings(): AppSettings {
    try {
        const stored = localStorage.getItem(STORAGE_ID);
        if (stored) {
            // merge stored settings with defaults to ensure new fields are present
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.error("Failed to load settings", e);
    }
    return { ...DEFAULT_SETTINGS };
}

export const appSettings = proxy<AppSettings>(loadSettings());

themeApplyMode(appSettings.theme);

subscribe(appSettings, () => {
    try {
        themeApplyMode(appSettings.theme);
        localStorage.setItem(STORAGE_ID, JSON.stringify(appSettings));
    } catch (e) {
        console.error("Failed to save settings", e);
    }
});
