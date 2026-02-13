import { atom, getDefaultStore } from "jotai";
import { ref } from "valtio";
import { extractTracesFromZipInWorker, isTrc3File, isZipFile } from "@/workers-client";
import { setAppTitle } from "@/store/3-ui-app-title";
import { notice } from "@/components/ui/local-ui/7-toaster";
import { filesStore, type FileData, type FileState } from "./9-types-files-store";
import { asyncParseTraceFile } from "./8-2-parse-trace-file";
import { emptyFileHeader, type TraceLine } from "@/trace-viewer-core/9-core-types";
import { recomputeFilterMatches } from "../4-file-filters";
import { appSettings } from "../1-ui-settings";
import { matchesFilePattern } from "../6-filtered-files";
import { buildAlltimes } from "./3-2-all-times-listener";
import { setFileLoading } from "./8-3-file-loading-atoms";
import { recomputeHighlightMatches } from "../5-highlight-rules";
import { allTimesStore } from "./3-1-all-times-store";
import { selectFile } from "./0-2-files-actions";
import { getCurrentFileState, setCurrentFileState } from "./0-1-files-current-state";

export const isLoadingFilesAtom = atom(false);

export async function asyncLoadAnyFiles(files: File[], droppedFolderName?: string, filePaths?: string[]) {
    getDefaultStore().set(isLoadingFilesAtom, true);
    allTimesStore.setAllTimes([]);
    try {
        let loadedTrc3FilesCount = 0;
        const zipFiles = files.filter(f => isZipFile(f));
        const trc3Files = files.filter(f => isTrc3File(f));

        // Extract and load files from ZIPs
        for (const file of zipFiles) {
            const result = await extractTracesFromZipInWorker(file);

            if (result.files.length > 0) {
                loadedTrc3FilesCount += result.files.length;
                await loadFilesToStore(result.files);
                setAppTitle(result.files, result.zipFileName);
            }
        }

        // Load .TRC3 files directly
        await loadFilesToStore(trc3Files);
        loadedTrc3FilesCount += trc3Files.length;
        setAppTitle(files, droppedFolderName, filePaths);

        if (loadedTrc3FilesCount === 0) {
            const sourceName = buildDroppedSourceName(files, droppedFolderName);
            notice.info(`No .trc3 files were found to load from "${sourceName}".`);
        }

        appSettings.allTimes.needToRebuild = true;
        buildAlltimes();
    } finally {
        getDefaultStore().set(isLoadingFilesAtom, false);
    }
}

function buildDroppedSourceName(files: File[], droppedFolderName?: string): string {
    if (droppedFolderName) {
        return droppedFolderName;
    }
    if (files.length === 1) {
        return files[0].name;
    }
    if (files.length > 1) {
        return `${files.length} files`;
    }
    return "drop";
}

async function loadFilesToStore(files: File[]) {
    // Check if this is the first load (no files existed before)
    const isFirstLoad = filesStore.states.length === 0;

    const itemsToLoad: { file: File, fileState: FileState; }[] = [];

    // Populate the store with new file states
    for (const file of files) {
        const newFileState = newTraceItemCreate(file);
        filesStore.states.push(newFileState);
        itemsToLoad.push({ file, fileState: newFileState });
    }

    // Recompute filters and highlights after all files list is populated
    recomputeFilterMatches();
    recomputeHighlightMatches();

    // Load the files
    for (const { file, fileState } of itemsToLoad) {
        await newTraceItemLoad(fileState, file);
    }

    // After all files are loaded, populate the quick file data
    for (const fileState of filesStore.states) {
        filesStore.quickFileData[fileState.id] = fileState.data;
    }

    // Handle file selection after loading
    const currentState = getCurrentFileState();
    if (itemsToLoad.length > 0) {
        // On first load, apply startup pattern to select a specific file
        if (isFirstLoad) {
            const startupPattern = appSettings.startupFilePattern;
            let fileToSelect = itemsToLoad[0].fileState;

            // If startup pattern is set, find the first matching file
            if (startupPattern) {
                const matchingFile = itemsToLoad.find(item => 
                    matchesFilePattern(item.fileState.data.fileName, startupPattern)
                );
                if (matchingFile) {
                    fileToSelect = matchingFile.fileState;
                }
            }

            selectFile(fileToSelect.id);
        } else if (!currentState) {
            // Not first load but no file selected - select first loaded file
            selectFile(itemsToLoad[0].fileState.id);
        } else if (itemsToLoad.some(item => item.fileState.id === currentState.id)) {
            // Force UI refresh by creating a new reference (data is loaded now)
            setCurrentFileState(currentState, true);
        }
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
            currentLineIdxAtom: atom(-1),
            scrollTopAtom: atom(0),
            showOnlySelectedThreadAtom: atom(false),
            threadLinesAtom: atom<TraceLine[] | undefined>(undefined),
            threadLineBaseIndicesAtom: atom<number[] | undefined>(undefined),
            threadBaseIndexToDisplayIndexAtom: atom<number[] | undefined>(undefined),
            threadLinesThreadIdAtom: atom<number | null>(null),
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

    // Update the reactive atom to trigger UI re-render for this specific file
    setFileLoading(fileState.id, false);

    // If this file is currently selected, force a refresh to show loaded data
    const currentState = getCurrentFileState();
    if (currentState?.id === fileState.id) {
        setCurrentFileState(fileState, true);
    }
}
