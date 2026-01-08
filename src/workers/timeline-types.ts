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
    timeline?: FullTimelineItem[];
    error?: string;
}

export interface FullTimelineItem {
    timestamp: string;
    fileIds: string[];
}
