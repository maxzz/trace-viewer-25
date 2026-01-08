import { type TimelineWorkerInput, type TimelineWorkerOutput, type TimelineItem } from '../workers/timeline-types';

let worker: Worker | null = null;
let currentReject: ((reason?: any) => void) | null = null;

export function buildTimeline(
    files: { id: string; lines: { timestamp?: string; lineIndex: number; date?: string; }[]; }[],
    precision: number
): Promise<TimelineItem[]> {
    // Cancel any existing work
    cancelTimelineBuild();

    worker = new Worker(new URL('../workers/timeline.worker.ts', import.meta.url), {
        type: 'module'
    });

    return new Promise(
        (resolve, reject) => {
            currentReject = reject;

            worker!.onmessage = (e: MessageEvent<TimelineWorkerOutput>) => {
                const { type, timeline, error } = e.data;
                if (type === 'SUCCESS' && timeline) {
                    resolve(timeline);
                    cleanup();
                } else if (type === 'ERROR') {
                    reject(new Error(error));
                    cleanup();
                }
            };

            worker!.onerror = (err) => {
                reject(err);
                cleanup();
            };

            // Prepare minimal data to send
            const filesData = files.map(
                (f) => ({
                    id: f.id,
                    lines: f.lines.map(l => ({ timestamp: l.timestamp, lineIndex: l.lineIndex, date: l.date }))
                })
            );

            const msg: TimelineWorkerInput = {
                type: 'BUILD',
                files: filesData,
                precision
            };
            worker!.postMessage(msg);
        }
    );
}

export function cancelTimelineBuild() {
    if (worker) {
        worker.terminate();
        worker = null;
    }
    if (currentReject) {
        currentReject(new Error('Timeline build cancelled'));
        currentReject = null;
    }
}

function cleanup() {
    // We can keep the worker alive if we want to reuse, but for now strict lifecycle
    if (worker) {
        worker.terminate();
        worker = null;
    }
    currentReject = null;
}
