import { extractTracesFromZipInWorker, isZipFile } from "@/workers-client";
import { traceStore } from "./0-state";

export async function asyncLoadAnyFiles(files: File[]) {
    const zipFiles = files.filter(f => isZipFile(f));
    const nonZipFiles = files.filter(f => !isZipFile(f));

    // Load new files
    for (const file of zipFiles) {
        await extractTracesFromZipInWorker(file);
    }

    asyncLoadFilesFromZip(nonZipFiles);
}

export async function asyncLoadFilesFromZip(files: File[]) {
    for (const file of files) {
        traceStore.loadTrace(file);
    }
}
