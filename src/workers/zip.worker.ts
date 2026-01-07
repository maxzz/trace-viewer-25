import * as fflate from 'fflate';
import type { ZipWorkerRequest, ZipWorkerResponse, ExtractedFile } from './zip-worker-types';

self.onmessage = async (e: MessageEvent<ZipWorkerRequest>) => {
    const { type, file } = e.data;

    if (type !== 'EXTRACT') {
        return;
    }

    try {
        const buffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);

        const extractedFiles: ExtractedFile[] = [];

        // Unzip synchronously (inside worker)
        const unzipped = fflate.unzipSync(uint8Array, {
            filter: (file) => {
                // Only extract files ending with .trc3
                return file.name.toLowerCase().endsWith('.trc3');
            }
        });

        for (const [filename, fileData] of Object.entries(unzipped)) {
            // fileData is Uint8Array
            extractedFiles.push({
                name: filename.split('/').pop() || filename, // Use only the base name
                buffer: fileData.buffer.slice(fileData.byteOffset, fileData.byteOffset + fileData.byteLength)
            });
        }

        const response: ZipWorkerResponse = {
            type: 'SUCCESS',
            files: extractedFiles
        };
        self.postMessage(response);

    } catch (error: any) {
        const response: ZipWorkerResponse = {
            type: 'ERROR',
            error: error.message || 'Unknown error during unzip'
        };
        self.postMessage(response);
    }
};
