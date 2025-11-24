import { proxy } from 'valtio';
import { TraceParser } from '../trace-viewer-core/parser';
import type { TraceLine, TraceHeader } from '../trace-viewer-core/types';

export interface TraceState {
    lines: TraceLine[];
    header: TraceHeader;
    isLoading: boolean;
    error: string | null;
    currentLineIndex: number;
    loadTrace: (file: File) => Promise<void>;
}

export const traceStore = proxy<TraceState>({
    lines: [],
    header: { magic: '' },
    isLoading: false,
    error: null,
    currentLineIndex: -1,
    loadTrace: async (file: File) => {
        traceStore.isLoading = true;
        traceStore.error = null;
        traceStore.lines = [];
        traceStore.header = { magic: '' };

        try {
            const arrayBuffer = await file.arrayBuffer();
            const parser = new TraceParser(arrayBuffer);
            
            // Offload parsing to avoid blocking UI? 
            // For now, sync. Ideally use Web Worker.
            parser.parse();

            // Filter out Time lines for display but keep them in data structure if needed later
            // Ideally, we should have a "viewLines" separate from "rawLines"
            traceStore.lines = parser.lines.filter(l => l.code !== 84); // 84 is LineCode.Time
            traceStore.header = parser.header;
        } catch (e: any) {
            console.error("Failed to load trace", e);
            traceStore.error = e.message || "Unknown error";
        } finally {
            traceStore.isLoading = false;
        }
    }
});

