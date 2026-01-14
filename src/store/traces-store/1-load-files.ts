import { extractTracesFromZipInWorker, isTrc3File, isZipFile } from "@/workers-client";
import { setAppTitle } from "@/store/3-ui-app-title";
import { traceStore } from "./0-state";
import { filesStore, type FileData, type FileState } from "./9-types-files-store";
import { ref } from "valtio";
import { asyncParseTraceFile } from "./2-parse-trace-file";
import { emptyFileHeader } from "@/trace-viewer-core/9-core-types";
import { recomputeFilterMatches } from "../4-file-filters";
import { recomputeHighlightMatches } from "../5-highlight-rules";
import { buildAlltimes } from "./8-all-times-listener";

export async function asyncLoadAnyFiles(files: File[], droppedFolderName?: string, filePaths?: string[]) {
    const zipFiles = files.filter(f => isZipFile(f));
    const trc3Files = files.filter(f => isTrc3File(f));

    // Extract and load files from ZIPs
    for (const file of zipFiles) {
        const result = await extractTracesFromZipInWorker(file);

        if (result.files.length > 0) {
            await loadFilesToStore(result.files);
            setAppTitle(result.files, result.zipFileName);
        }
    }

    // Load .TRC3 files directly
    await loadFilesToStore(trc3Files);

    setAppTitle(files, droppedFolderName, filePaths);

    // Recompute filters and highlights for the new file
    recomputeFilterMatches();
    recomputeHighlightMatches();

    buildAlltimes();
}

async function loadFilesToStore(files: File[]) {
    const itemsToLoad: { file: File, fileState: FileState; }[] = [];

    // Populate the store with new file states
    for (const file of files) {
        const newFileState = newTraceItemCreate(file);
        filesStore.states.push(newFileState);
        itemsToLoad.push({ file, fileState: newFileState });
    }

    // Load the files
    for (const { file, fileState } of itemsToLoad) {
        await newTraceItemLoad(fileState, file);
    }

    // After all files are loaded, populate the quick file data
    for (const fileState of filesStore.states) {
        filesStore.quickFileData[fileState.id] = fileState.data;
    }
}

function newTraceItemCreate(file: File): FileState {
    const id = MakeUuid();
    const newFileData = createNewFileData(id, file.name);
    const newFile = createNewFileState(id, ref(newFileData));
    return newFile;

    function MakeUuid(): string {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    }

    function createNewFileData(id: string, fileName: string): FileData {
        return {
            id,
            fileName,
            rawLines: [],
            viewLines: [],
            uniqueThreadIds: [],
            header: emptyFileHeader,
            errorsInTraceCount: 0,
            isLoading: true,
            errorLoadingFile: null,
        };
    }

    function createNewFileState(id: string, data: FileData): FileState {
        return {
            id,
            data, // Placeholder, will update after adding to store
            currentLineIndex: -1,
            matchedFilterIds: [],
            matchedHighlightIds: []
        };
    }
}

async function newTraceItemLoad(fileState: FileState, file: File): Promise<void> {
    const data = fileState.data;
    try {
        const parsed = await asyncParseTraceFile(file);

        data.rawLines = parsed.rawLines;
        data.viewLines = parsed.viewLines;
        data.uniqueThreadIds = parsed.uniqueThreadIds;
        data.header = parsed.header;
        data.errorsInTraceCount = parsed.errorCount;
        data.isLoading = false;
    } catch (e: any) {
        data.errorLoadingFile = e.message || "Unknown error";
        data.isLoading = false;
        console.error("Failed to load trace", e);
    }
}
