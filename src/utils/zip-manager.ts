import { getDefaultStore } from 'jotai';
import { isZipProcessingAtom } from '../store/2-ui-atoms';
import { traceStore } from '../store/traces-store/0-state';
import { setAppTitle } from '../store/3-ui-app-title';
import type { ZipWorkerRequest, ZipWorkerResponse } from '../workers/zip-worker-types';
import ZipWorker from '../workers/zip.worker?worker';

// Reuse the worker instance
let workerInstance: Worker | null = null;

function getWorker(): Worker {
    if (!workerInstance) {
        workerInstance = new ZipWorker();
    }
    return workerInstance;
}

export async function extractTracesFromZip(file: File): Promise<void> {
    const store = getDefaultStore();
    
    // Set loading state
    store.set(isZipProcessingAtom, true);
    
    // We do NOT close existing files here. The caller is responsible for clearing state 
    // if this is a "new open" operation. This allows adding files from ZIP to existing ones
    // or processing multiple ZIPs.

    const worker = getWorker();

    return new Promise((resolve, reject) => {
        const handleMessage = (e: MessageEvent<ZipWorkerResponse>) => {
            const response = e.data;
            
            // Clean up listener for this request (assuming serial requests for now)
            // Ideally we'd match IDs but for single file drop it's fine.
            worker.removeEventListener('message', handleMessage);
            store.set(isZipProcessingAtom, false);

            if (response.type === 'SUCCESS') {
                if (response.files.length === 0) {
                     // No .trc3 files found
                     // Maybe show a toast?
                     console.warn('No .trc3 files found in ZIP');
                     resolve();
                     return;
                }

                // Convert extracted buffers to File objects
                const extractedFiles = response.files.map(extracted => {
                    return new File([extracted.buffer], extracted.name, {
                        type: 'application/octet-stream' // or specific type if known
                    });
                });

                // Update title with the ZIP filename
                // We pass the extracted files as "files" and the zip name as "droppedFolderName" equivalent
                // so the title becomes "App - ZipName.zip"
                setAppTitle(extractedFiles, file.name);

                // Load files into store
                extractedFiles.forEach(f => {
                    traceStore.loadTrace(f);
                });

                resolve();
            } else {
                console.error('ZIP Worker Error:', response.error);
                // traceStore.error = response.error; // Global error?
                reject(new Error(response.error));
            }
        };

        worker.addEventListener('message', handleMessage);

        const request: ZipWorkerRequest = {
            type: 'EXTRACT',
            file
        };
        worker.postMessage(request);
    });
}
