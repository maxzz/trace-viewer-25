export interface AllTimesWorkerInput {
    type: 'BUILD';
    files: {
        id: string;
        lines: { timestamp?: string; lineIndex: number; date?: string; }[];
    }[];
    precision: number;
}

export interface AllTimesWorkerOutput {
    type: 'SUCCESS' | 'ERROR' | 'CANCELLED';
    allTimes?: AllTimesItem[];
    error?: string;
}

export interface AllTimesItem {
    timestamp: string;
    fileIds: string[];
}
