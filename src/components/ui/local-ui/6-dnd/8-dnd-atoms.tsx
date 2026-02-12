import { atom } from "jotai";
import { isOurFile, isTrc3File, isZipFile } from "@/workers-client";
import { closeAllFiles } from "@/store/traces-store/0-files-actions";
import { asyncLoadAnyFiles } from "@/store/traces-store/1-1-load-files";
import { notice } from "@/components/ui/local-ui/7-toaster";

export type DoSetFilesFrom_Dnd_Atom = typeof doSetFilesFrom_Dnd_Atom;

interface FileWithPath {
    file: File;
    path: string;
}

export const doSetFilesFrom_Dnd_Atom = atom(                    // used by DropItDoc only
    null,
    async (get, set, dataTransfer: DataTransfer) => {
        const filesWithPaths: FileWithPath[] = [];
        let droppedFolderName: string | undefined;
        let unsupportedSingleFileName: string | undefined;

        // IMPORTANT: webkitGetAsEntry() is only valid synchronously during the drop event.
        // We must collect all entries BEFORE any async operations.
        const entries: FileSystemEntry[] = [];
        const fallbackFiles: File[] = [];

        if (dataTransfer.items) {
            // Check if single folder dropped
            if (dataTransfer.items.length === 1) {
                const item = dataTransfer.items[0];
                const entry = (item as any).webkitGetAsEntry?.() as FileSystemEntry | null | undefined;
                if (entry && entry.isDirectory) {
                    droppedFolderName = entry.name;
                }

                if (!droppedFolderName && item.kind === 'file') {
                    const file = item.getAsFile();
                    if (file && !isOurFile(file)) {
                        unsupportedSingleFileName = file.name;
                    }
                }
            }

            // Collect all entries synchronously first
            for (let i = 0; i < dataTransfer.items.length; i++) {
                const item = dataTransfer.items[i];

                if (item.kind === 'file') {
                    const entry = (item as any).webkitGetAsEntry?.() as FileSystemEntry | null | undefined;

                    if (entry) {
                        entries.push(entry);
                    } else {
                        // Fallback to direct file access
                        const file = item.getAsFile();
                        if (file && (isTrc3File(file) || isZipFile(file))) {
                            fallbackFiles.push(file);
                        }
                    }
                }
            }

            // Now process entries asynchronously
            for (const entry of entries) {
                await processEntry(entry, filesWithPaths);
            }
            // Add fallback files with empty path
            fallbackFiles.forEach(file => filesWithPaths.push({ file, path: '' }));
        } else {
            // Fallback for older browsers
            for (let i = 0; i < dataTransfer.files.length; i++) {
                const file = dataTransfer.files[i];
                if (isOurFile(file)) {
                    filesWithPaths.push({ file, path: '' });
                }
            }
        }

        if (filesWithPaths.length === 0) {
            if ((dataTransfer.items && dataTransfer.items.length > 0) || dataTransfer.files.length > 0) {
                if (unsupportedSingleFileName) {
                    notice.info(`Unsupported file "${unsupportedSingleFileName}". Please drop a .trc3 file or a ZIP archive with .trc3 files.`);
                } else {
                    const sourceName = droppedFolderName || dataTransfer.files?.[0]?.name || "drop";
                    notice.info(`No .trc3 files were found to load from "${sourceName}".`);
                }
            }
            return;
        }

        // Clear previously uploaded files
        closeAllFiles();

        // Extract files and paths
        const files = filesWithPaths.map(fp => fp.file);
        const filePaths = filesWithPaths.map(fp => fp.path);

        // Load new files
        asyncLoadAnyFiles(files, droppedFolderName, filePaths);
    }
);

// Helper function to process a single entry (file or directory)
async function processEntry(entry: FileSystemEntry, rv: FileWithPath[]): Promise<void> {
    if (entry.isFile) {
        return new Promise((resolve, reject) => {
            (entry as FileSystemFileEntry).file(
                (file) => {
                    if (isOurFile(file)) {
                        rv.push({ file, path: entry.fullPath });
                    }
                    resolve();
                },
                reject
            );
        });
    } else if (entry.isDirectory) {
        // Only process first-level files in directory
        await collectFilesFromDirectory(entry as FileSystemDirectoryEntry, rv);
    }
}

// TypeScript declarations for FileSystemEntry API (webkitGetAsEntry)

interface FileSystemEntry {
    readonly isFile: boolean;
    readonly isDirectory: boolean;
    readonly name: string;
    readonly fullPath: string;
}

interface FileSystemFileEntry extends FileSystemEntry {
    readonly isFile: true;
    readonly isDirectory: false;
    file(successCallback: (file: File) => void, errorCallback?: (error: Error) => void): void;
}

interface FileSystemDirectoryEntry extends FileSystemEntry {
    readonly isFile: false;
    readonly isDirectory: true;
    createReader(): FileSystemDirectoryReader;
}

interface FileSystemDirectoryReader {
    readEntries(successCallback: (entries: FileSystemEntry[]) => void, errorCallback?: (error: Error) => void): void;
}

// Helper function to recursively collect files from a directory entry (first level only)
async function collectFilesFromDirectory(entry: FileSystemDirectoryEntry, rv: FileWithPath[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const reader = entry.createReader();
        const entries: FileSystemEntry[] = [];

        function readEntries() {
            reader.readEntries(
                (batch) => {
                    if (batch.length === 0) {
                        // All entries read, now process them
                        Promise.all(
                            entries.map(
                                async (childEntry) => {
                                    if (childEntry.isFile) {
                                        return new Promise<FileWithPath | null>((resolveFile) => {
                                            (childEntry as FileSystemFileEntry).file(
                                                (file) => {
                                                    resolveFile((isOurFile(file)) ? { file, path: childEntry.fullPath } : null);
                                                },
                                                reject
                                            );
                                        });
                                    }
                                    return null;
                                }
                            )
                        ).then((fileResults) => {
                            rv.push(...fileResults.filter((f): f is FileWithPath => f !== null));
                            resolve();
                        });
                    } else {
                        entries.push(...batch);
                        readEntries(); // Continue reading
                    }
                },
                reject
            );
        }

        readEntries();
    });
}
