import { proxy } from 'valtio';
import { TraceParser } from '../trace-viewer-core/parser';
import type { TraceLine, TraceHeader } from '../trace-viewer-core/types';

export interface TraceState {
    lines: TraceLine[]; // Use this for display (alias for viewLines)
    rawLines: TraceLine[]; // Contains all lines including Time, etc.
    viewLines: TraceLine[]; // Filtered lines for display
    header: TraceHeader;
    fileName: string | null;
    isLoading: boolean;
    error: string | null;
    currentLineIndex: number;
    loadTrace: (file: File) => Promise<void>;
}

export const traceStore = proxy<TraceState>({
    lines: [],
    rawLines: [],
    viewLines: [],
    header: { magic: '' },
    fileName: null,
    isLoading: false,
    error: null,
    currentLineIndex: -1,
    loadTrace: async (file: File) => {
        traceStore.isLoading = true;
        traceStore.error = null;
        traceStore.fileName = file.name;
        traceStore.lines = [];
        traceStore.rawLines = [];
        traceStore.viewLines = [];
        traceStore.header = { magic: '' };

        try {
            const arrayBuffer = await file.arrayBuffer();
            const parser = new TraceParser(arrayBuffer);
            
            // Offload parsing to avoid blocking UI? 
            // For now, sync. Ideally use Web Worker.
            parser.parse();

            traceStore.rawLines = parser.lines;
            // Filter out Time lines (84) for default view
            traceStore.viewLines = parser.lines.filter(l => l.code !== 84);
            // Alias lines to viewLines for backward compatibility with components
            traceStore.lines = traceStore.viewLines;
            
            traceStore.header = parser.header;
        } catch (e: any) {
            console.error("Failed to load trace", e);
            traceStore.error = e.message || "Unknown error";
        } finally {
            traceStore.isLoading = false;
        }
    }
});

