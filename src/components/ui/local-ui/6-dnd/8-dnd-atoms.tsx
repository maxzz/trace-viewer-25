import { traceStore } from "@/store/traces-store/0-state";
import { atom } from "jotai";
import { setAppTitle } from '@/store/3-ui-app-title';
import { isOurFile, isTrc3File, isZipFile } from "@/workers-client";
import { asyncLoadAnyFiles } from "@/store/traces-store/1-load-files";

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
            return;
        }

        // Clear previously uploaded files
        traceStore.closeAllFiles();

        // Extract files and paths
        const files = filesWithPaths.map(fp => fp.file);
        const filePaths = filesWithPaths.map(fp => fp.path);

        // Update title
        setAppTitle(files, droppedFolderName, filePaths);

        // Load new files
        asyncLoadAnyFiles(files);
    }
);

// Helper function to process a single entry (file or directory)
async function processEntry(entry: FileSystemEntry, filesWithPaths: FileWithPath[]): Promise<void> {
    if (entry.isFile) {
        return new Promise((resolve, reject) => {
            (entry as FileSystemFileEntry).file(
                (file) => {
                    if (isOurFile(file)) {
                        filesWithPaths.push({ file, path: entry.fullPath });
                    }
                    resolve();
                },
                reject
            );
        });
    } else if (entry.isDirectory) {
        // Only process first-level files in directory
        await collectFilesFromDirectory(entry as FileSystemDirectoryEntry, filesWithPaths);
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
async function collectFilesFromDirectory(entry: FileSystemDirectoryEntry, filesWithPaths: FileWithPath[]): Promise<void> {
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
                                            (childEntry as FileSystemFileEntry).file((file) => {
                                                resolveFile((isOurFile(file)) ? { file, path: childEntry.fullPath } : null);
                                            }, reject);
                                        });
                                    }
                                    return null;
                                }
                            )
                        ).then((fileResults) => {
                            filesWithPaths.push(...fileResults.filter((f): f is FileWithPath => f !== null));
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
