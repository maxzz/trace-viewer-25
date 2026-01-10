import { type TraceLine } from '@/trace-viewer-core/9-core-types';
import { type AllTimesWorkerInput, type AllTimesWorkerOutput, type AllTimesItem } from '../workers/all-times-worker-types';

let worker: Worker | null = null;
let currentReject: ((reason?: any) => void) | null = null;

type LineForFullTimeline = Pick<TraceLine, 'timestamp' | 'lineIndex' | 'date'>;

export function buildAllTimesInWorker(files: { id: string; lines: LineForFullTimeline[]; }[], precision: number): Promise<AllTimesItem[]> {
    // Cancel any existing work
    cancelFullTimelineBuild();

    worker = new Worker(new URL('../workers/all-times.worker.ts', import.meta.url), { type: 'module' });

    return new Promise(
        (resolve, reject) => {
            currentReject = reject;

            worker!.onmessage = (e: MessageEvent<AllTimesWorkerOutput>) => {
                const { type, allTimes: timeline, error } = e.data;
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
                    lines: f.lines.map((l: LineForFullTimeline) => ({ timestamp: l.timestamp, lineIndex: l.lineIndex, date: l.date }))
                })
            );

            const msg: AllTimesWorkerInput = {
                type: 'BUILD',
                files: filesData,
                precision
            };
            worker!.postMessage(msg);
        }
    );
}

export function cancelFullTimelineBuild() {
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
