export interface TimelineWorkerInput {
    type: 'BUILD';
    files: {
        id: string;
        lines: { timestamp?: string; lineIndex: number; date?: string; }[];
    }[];
    precision: number;
}

export interface TimelineWorkerOutput {
    type: 'SUCCESS' | 'ERROR' | 'CANCELLED';
    timeline?: { timestamp: string; fileIds: string[] }[];
    error?: string;
}

export interface TimelineItem {
    timestamp: string;
    fileIds: string[];
}
