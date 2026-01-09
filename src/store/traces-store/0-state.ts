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
    files: TraceFile[];
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

    // Timeline
    timeline: FullTimelineItem[];
    isTimelineLoading: boolean;
    timelineError: string | null;
    selectedTimelineTimestamp: string | null;

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
    files: [],
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
    timeline: [],
    isTimelineLoading: false,
    timelineError: null,
    selectedTimelineTimestamp: null,

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
        traceStore.files.push(newFile);

        // Select it (this will update loading state in UI)
        traceStore.selectFile(id);

        try {
            const parsedData = await parseTraceFile(file);

            // Find the file in store
            const fileIndex = traceStore.files.findIndex(f => f.id === id);
            if (fileIndex !== -1) {
                const updatedFile = traceStore.files[fileIndex];
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
            const fileIndex = traceStore.files.findIndex(f => f.id === id);
            if (fileIndex !== -1) {
                traceStore.files[fileIndex].error = e.message || "Unknown error";
                traceStore.files[fileIndex].isLoading = false;
                if (traceStore.selectedFileId === id) {
                    traceStore.error = traceStore.files[fileIndex].error;
                    traceStore.isLoading = false;
                }
            }
        }
    },

    selectFile: (id: string | null) => {
        traceStore.selectedFileId = id;

        if (id) {
            const file = traceStore.files.find(f => f.id === id);
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
        const index = traceStore.files.findIndex(f => f.id === id);
        if (index !== -1) {
            traceStore.files.splice(index, 1);

            // If closed file was selected, select another one
            if (traceStore.selectedFileId === id) {
                if (traceStore.files.length > 0) {
                    // Select the next file, or the previous one if we closed the last one
                    const nextIndex = Math.min(index, traceStore.files.length - 1);
                    traceStore.selectFile(traceStore.files[nextIndex].id);
                } else {
                    traceStore.selectFile(null);
                }
            }
        }
    },

    closeOtherFiles: (id: string) => {
        traceStore.files = traceStore.files.filter(f => f.id === id);
        if (traceStore.selectedFileId !== id) {
            traceStore.selectFile(id);
        }
    },

    closeAllFiles: () => {
        traceStore.files = [];
        traceStore.selectFile(null);
    },

    setFullTimeline: (items: FullTimelineItem[]) => {
        traceStore.timeline = items;
        traceStore.isTimelineLoading = false;
        traceStore.timelineError = null;
    },

    setTimelineLoading: (loading: boolean) => {
        traceStore.isTimelineLoading = loading;
        if (loading) {
            traceStore.timelineError = null;
        }
    },

    selectTimelineTimestamp: (timestamp: string | null) => {
        traceStore.selectedTimelineTimestamp = timestamp;
    },

    scrollToTimestamp: (timestamp: string | null) => {
        if (!timestamp) return;
        
        const lines = traceStore.viewLines;
        if (lines.length === 0) return;

        // Parse target timestamp to ms for accurate comparison
        // Format: HH:MM:SS.mmm
        const parseTime = (t: string) => {
            const [hms, ms] = t.split('.');
            const [h, m, s] = hms.split(':').map(Number);
            return (h * 3600 + m * 60 + s) * 1000 + (parseInt(ms || '0', 10));
        };

        const targetTime = parseTime(timestamp);
        let bestIndex = -1;
        let minDiff = Infinity;

        // Binary search for the first element >= timestamp (lower_bound)
        let low = 0;
        let high = lines.length - 1;
        let insertionIndex = lines.length;

        // We assume lines are sorted by timestamp for binary search.
        // Even if slightly unsorted, this heuristic gives a good starting point.
        // We'll scan a small window around it if needed, or just rely on it.
        while (low <= high) {
            const mid = (low + high) >>> 1;
            const tStr = lines[mid].timestamp;
            if (!tStr) {
                // If timestamp missing, heuristic: continue to next
                low = mid + 1;
                continue;
            }

            // String comparison is usually sufficient for ">= " check if format is fixed width (HH:MM:SS.mmm)
            // But let's verify format. If length differs, use parsed value.
            // For speed, try string compare first.
            if (tStr >= timestamp) {
                insertionIndex = mid;
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }

        // Check candidates around insertion point (look ahead and behind)
        // because "closest" could be the one slightly before or slightly after
        // or a few lines away if there are timestamp duplicates or slight disorder
        const candidates = [];
        for (let i = Math.max(0, insertionIndex - 5); i <= Math.min(lines.length - 1, insertionIndex + 5); i++) {
            candidates.push(i);
        }
        
        for (const idx of candidates) {
            const tStr = lines[idx].timestamp;
            if (tStr) {
                const tVal = parseTime(tStr);
                const diff = Math.abs(tVal - targetTime);
                if (diff < minDiff) {
                    minDiff = diff;
                    bestIndex = idx;
                } else if (diff === minDiff && bestIndex !== -1) {
                   // If diff is same, prefer the earlier one (or whatever stable sort preference)
                   // usually we don't need to change anything if we want first occurrence
                }
            }
        }
        
        if (bestIndex !== -1) {
            traceStore.currentLineIndex = bestIndex;
        } else if (lines.length > 0) {
            // Fallback: if we couldn't find close timestamp, do nothing or select start
        }
    },

    asyncBuildFullTimes: async (precision: number) => {
        traceStore.setTimelineLoading(true);
        try {
            // Prepare data
            const inputFiles = traceStore.files.map(
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
            const file = traceStore.files.find(f => f.id === traceStore.selectedFileId);
            // Only update if changed to avoid infinite loops if syncActiveFile triggers this
            if (file && file.currentLineIndex !== traceStore.currentLineIndex) {
                file.currentLineIndex = traceStore.currentLineIndex;
            }
        }
    }
);
