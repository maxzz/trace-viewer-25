import { extractTracesFromZipInWorker, isZipFile } from "@/workers-client";
import { setAppTitle } from "@/store/3-ui-app-title";
import { traceStore } from "./0-state";

export async function asyncLoadAnyFiles(files: File[]) {
    const zipFiles = files.filter(f => isZipFile(f));
    const nonZipFiles = files.filter(f => !isZipFile(f));

    // Extract and load files from ZIPs
    for (const file of zipFiles) {
        const result = await extractTracesFromZipInWorker(file);

        if (result.files.length > 0) {
            setAppTitle(result.files, result.zipFileName);
            loadFilesToStore(result.files);
        }
    }

    // Load non-ZIP files directly
    loadFilesToStore(nonZipFiles);
}

function loadFilesToStore(files: File[]) {
    for (const file of files) {
        traceStore.loadTrace(file);
    }
}
