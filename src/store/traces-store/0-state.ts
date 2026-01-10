import { proxy, subscribe } from "valtio";
import { notice } from "../../components/ui/local-ui/7-toaster";
import { type TraceLine, type TraceHeader } from "../../trace-viewer-core/9-core-types";
import { type FullTimelineItem } from "../../workers/timeline-types";
import { parseTraceFile } from "./1-parse-trace-file";
import { buildFullTimeline as buildFullTimeline } from "../../workers-client/timeline-client";

export interface TraceFile {
    id: string;
    fileName: string;
    rawLines: TraceLine[];
    viewLines: TraceLine[];
    lines: TraceLine[]; // Alias for viewLines
    uniqueThreadIds: number[];
    header: TraceHeader;
    errorCount: number;
    isLoading: boolean;
    error: string | null;
    currentLineIndex: number;
    matchedFilterIds: string[]; // Cache for FILTERS that match this file (for hiding)
    matchedHighlightIds: string[]; // Cache for HIGHLIGHT rules that match this file (for coloring)
}

export interface TraceState {
    traceFiles: TraceFile[];
    selectedFileId: string | null;

    // Active file properties (mirrored from selected file for backward compatibility)
    lines: TraceLine[];
    rawLines: TraceLine[];
    viewLines: TraceLine[];
    uniqueThreadIds: number[];
    header: TraceHeader;
    fileName: string | null;
    isLoading: boolean;
    error: string | null;
    currentLineIndex: number;

    // Full timeline
    fullTimeline: FullTimelineItem[];                  // Full timeline items
    isFullTimelineLoading: boolean;                    // Whether the full timeline is loading
    timelineError: string | null;                      // Error message for the full timeline
    fullTimelineSelectedTimestamp: string | null;      // Timestamp of the selected item in the full timeline
    pendingScrollTimestamp: string | null;             // Timestamp to scroll TraceList to when the full timeline is selected

    // Actions
    loadTrace: (file: File) => Promise<void>;
    selectFile: (id: string | null) => void;
    closeFile: (id: string) => void;
    closeOtherFiles: (id: string) => void;
    closeAllFiles: () => void;
    setFullTimeline: (items: FullTimelineItem[]) => void;
    setTimelineLoading: (loading: boolean) => void;
    selectTimelineTimestamp: (timestamp: string | null) => void;
    scrollToTimestamp: (timestamp: string | null) => void;
    asyncBuildFullTimes: (precision: number) => Promise<void>;
}

const emptyHeader = { magic: '' };

import { recomputeFilterMatches } from "../4-file-filters";
import { recomputeHighlightMatches } from "../5-highlight-rules";

export const traceStore = proxy<TraceState>({
    traceFiles: [],
    selectedFileId: null,

    // Initial empty state
    lines: [],
    rawLines: [],
    viewLines: [],
    uniqueThreadIds: [],
    header: emptyHeader,
    fileName: null,
    isLoading: false,
    error: null,
    currentLineIndex: -1,

    // Timeline
    fullTimeline: [],
    isFullTimelineLoading: false,
    timelineError: null,
    fullTimelineSelectedTimestamp: null,
    pendingScrollTimestamp: null,

    loadTrace: async (file: File) => {
        const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

        // Create new file entry
        const newFile: TraceFile = {
            id,
            fileName: file.name,
            rawLines: [],
            viewLines: [],
            lines: [],
            uniqueThreadIds: [],
            header: emptyHeader,
            errorCount: 0,
            isLoading: true,
            error: null,
            currentLineIndex: -1,
            matchedFilterIds: [],
            matchedHighlightIds: []
        };

        // Add to store immediately
        traceStore.traceFiles.push(newFile);

        // Select it (this will update loading state in UI)
        traceStore.selectFile(id);

        try {
            const parsedData = await parseTraceFile(file);

            // Find the file in store
            const fileIndex = traceStore.traceFiles.findIndex(f => f.id === id);
            if (fileIndex !== -1) {
                const updatedFile = traceStore.traceFiles[fileIndex];
                updatedFile.rawLines = parsedData.rawLines;
                updatedFile.viewLines = parsedData.viewLines;
                updatedFile.lines = parsedData.viewLines;
                updatedFile.uniqueThreadIds = parsedData.uniqueThreadIds;
                updatedFile.header = parsedData.header;
                updatedFile.errorCount = parsedData.errorCount;
                updatedFile.isLoading = false;

                // If this is still the selected file, update the top-level properties
                if (traceStore.selectedFileId === id) {
                    syncActiveFile(updatedFile);
                }
                
                // Recompute filters and highlights for the new file
                recomputeFilterMatches();
                recomputeHighlightMatches();
            }
        } catch (e: any) {
            console.error("Failed to load trace", e);
            const fileIndex = traceStore.traceFiles.findIndex(f => f.id === id);
            if (fileIndex !== -1) {
                traceStore.traceFiles[fileIndex].error = e.message || "Unknown error";
                traceStore.traceFiles[fileIndex].isLoading = false;
                if (traceStore.selectedFileId === id) {
                    traceStore.error = traceStore.traceFiles[fileIndex].error;
                    traceStore.isLoading = false;
                }
            }
        }
    },

    selectFile: (id: string | null) => {
        traceStore.selectedFileId = id;

        if (id) {
            const file = traceStore.traceFiles.find(f => f.id === id);
            if (file) {
                syncActiveFile(file);
            }
        } else {
            // Reset to empty
            traceStore.lines = [];
            traceStore.rawLines = [];
            traceStore.viewLines = [];
            traceStore.uniqueThreadIds = [];
            traceStore.header = emptyHeader;
            traceStore.fileName = null;
            traceStore.isLoading = false;
            traceStore.error = null;
            traceStore.currentLineIndex = -1;
        }
    },

    closeFile: (id: string) => {
        const index = traceStore.traceFiles.findIndex(f => f.id === id);
        if (index !== -1) {
            traceStore.traceFiles.splice(index, 1);

            // If closed file was selected, select another one
            if (traceStore.selectedFileId === id) {
                if (traceStore.traceFiles.length > 0) {
                    // Select the next file, or the previous one if we closed the last one
                    const nextIndex = Math.min(index, traceStore.traceFiles.length - 1);
                    traceStore.selectFile(traceStore.traceFiles[nextIndex].id);
                } else {
                    traceStore.selectFile(null);
                }
            }
        }
    },

    closeOtherFiles: (id: string) => {
        traceStore.traceFiles = traceStore.traceFiles.filter(f => f.id === id);
        if (traceStore.selectedFileId !== id) {
            traceStore.selectFile(id);
        }
    },

    closeAllFiles: () => {
        traceStore.traceFiles = [];
        traceStore.selectFile(null);
    },

    setFullTimeline: (items: FullTimelineItem[]) => {
        traceStore.fullTimeline = items;
        traceStore.isFullTimelineLoading = false;
        traceStore.timelineError = null;
    },

    setTimelineLoading: (loading: boolean) => {
        traceStore.isFullTimelineLoading = loading;
        if (loading) {
            traceStore.timelineError = null;
        }
    },

    selectTimelineTimestamp: (timestamp: string | null) => {
        traceStore.fullTimelineSelectedTimestamp = timestamp;
    },

    scrollToTimestamp: (timestamp: string | null) => {
        traceStore.pendingScrollTimestamp = timestamp;
    },

    asyncBuildFullTimes: async (precision: number) => {
        traceStore.setTimelineLoading(true);
        try {
            // Prepare data
            const inputFiles = traceStore.traceFiles.map(
                (f) => ({
                    id: f.id,
                    lines: f.lines.map(
                        (l) => ({ timestamp: l.timestamp, lineIndex: l.lineIndex, date: l.date })
                    ) // Using viewLines (aliased as lines)
                })
            );

            const items = await buildFullTimeline(inputFiles, precision);
            traceStore.setFullTimeline(items);
            notice.success("Timeline built");
        } catch (e: any) {
            if (e.message === 'Timeline build cancelled') {
                // unexpected here unless we cancelled it
                notice.info("Timeline build cancelled");
            } else {
                console.error("Timeline build failed", e);
                traceStore.setTimelineLoading(false); // Make sure to stop loading
                notice.error(`Timeline build failed: ${e.message}`);
            }
        }
    }
});

function syncActiveFile(file: TraceFile) {
    traceStore.lines = file.lines;
    traceStore.rawLines = file.rawLines;
    traceStore.viewLines = file.viewLines;
    traceStore.uniqueThreadIds = file.uniqueThreadIds;
    traceStore.header = file.header;
    traceStore.fileName = file.fileName;
    traceStore.isLoading = file.isLoading;
    traceStore.error = file.error;
    traceStore.currentLineIndex = file.currentLineIndex;
}

// Subscribe to currentLineIndex changes to update the file state
subscribe(traceStore,
    () => {
        if (traceStore.selectedFileId) {
            const file = traceStore.traceFiles.find(f => f.id === traceStore.selectedFileId);
            // Only update if changed to avoid infinite loops if syncActiveFile triggers this
            if (file && file.currentLineIndex !== traceStore.currentLineIndex) {
                file.currentLineIndex = traceStore.currentLineIndex;
            }
        }
    }
);
