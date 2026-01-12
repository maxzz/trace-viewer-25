import { extractTracesFromZipInWorker, isTrc3File, isZipFile } from "@/workers-client";
import { setAppTitle } from "@/store/3-ui-app-title";
import { traceStore } from "./0-state";

export async function asyncLoadAnyFiles(files: File[], droppedFolderName?: string, filePaths?: string[]) {
    const zipFiles = files.filter(f => isZipFile(f));
    const trc3Files = files.filter(f => !isTrc3File(f));

    // Extract and load files from ZIPs
    for (const file of zipFiles) {
        const result = await extractTracesFromZipInWorker(file);

        if (result.files.length > 0) {
            loadFilesToStore(result.files);
            setAppTitle(result.files, result.zipFileName);
        }
    }

    // Load .TRC3 files directly
    loadFilesToStore(trc3Files);

    setAppTitle(files, droppedFolderName, filePaths);
}

function loadFilesToStore(files: File[]) {
    for (const file of files) {
        traceStore.loadTrace(file);
    }
}
