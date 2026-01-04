import { proxy, subscribe } from 'valtio';
import { type ThemeMode, themeApplyMode } from '../utils/theme-apply';

const STORE_KEY = "viewer-25";
const STORE_VER = "v1.0";
const STORAGE_ID = `${STORE_KEY}::${STORE_VER}`;

export interface AppSettings {
    showFooter: boolean;
    useIconsForEntryExit: boolean;
    theme: ThemeMode;
    panelSizes?: number[]; // ResizablePanelGroup panel sizes (percentages)
    extraInFooter: boolean; // Show header info (Computer, OS, Compiled) in footer
    // Future options can be added here
}

const DEFAULT_SETTINGS: AppSettings = {
    showFooter: true,
    useIconsForEntryExit: true,
    theme: 'light',
    extraInFooter: false,
};

const loadSettings = (): AppSettings => {
    try {
        const stored = localStorage.getItem(STORAGE_ID);
        if (stored) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.error("Failed to load settings", e);
    }
    return { ...DEFAULT_SETTINGS };
};

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

