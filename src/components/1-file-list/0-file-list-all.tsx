import { type RefObject, useEffect, useRef } from "react";
import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "../../store/1-ui-settings";
import { filesListStore } from "../../store/traces-store/0-files-current-state";
import { selectFile, closeFile } from "../../store/traces-store/0-files-actions";
import { filteredFilesAtom, filteredFilesSelectionEffectAtom } from "../../store/6-filtered-files";
import { ScrollArea } from "../ui/shadcn/scroll-area";
import { FileListRow } from "./1-file-list-row";
import { AllTimesPanel } from "./2-all-times-list";

export function FileList() {
    const { currentFileState } = useSnapshot(filesListStore);
    const selectedFileId = currentFileState?.id ?? null;
    const { allTimes } = useSnapshot(appSettings);
    const filteredFiles = useAtomValue(filteredFilesAtom);
    const containerRef = useRef<HTMLDivElement>(null);

    // Mount atom effect to handle selection change when filter results change
    useAtomValue(filteredFilesSelectionEffectAtom);

    // Keyboard navigation
    useEffect(
        () => {
            const controller = new AbortController();
            window.addEventListener('keydown', createFileListKeyDownHandler(containerRef, filteredFiles, selectedFileId), { signal: controller.signal });
            return () => controller.abort();
        }, [filteredFiles, selectedFileId]
    );

    return (
        <div ref={containerRef} className="h-full flex flex-row bg-muted/10 select-none outline-none focus-visible:ring-1 focus-visible:ring-ring" tabIndex={0}>
            {allTimes.onLeft && <AllTimesPanel />}

            <div className="flex-1 flex flex-col h-full min-w-0">
                <ScrollArea className="flex-1" fixedWidth>
                    <div className="flex flex-col">
                        {filteredFiles.map(
                            (file) => (
                                <FileListRow
                                    key={file.id}
                                    fileState={file}
                                    isSelected={file.id === selectedFileId}
                                />
                            )
                        )}
                    </div>
                </ScrollArea>
            </div>

            {!allTimes.onLeft && <AllTimesPanel />}
        </div>
    );
}

// Keyboard navigation

interface FileListItem {
    id: string;
    data: { fileName: string; };
}

function createFileListKeyDownHandler(containerRef: RefObject<HTMLDivElement | null>, filteredFiles: ReadonlyArray<FileListItem>, selectedFileId: string | null) {
    return function handleKeyDown(e: KeyboardEvent) {
        // Only handle if focus is within this component
        if (!containerRef.current?.contains(document.activeElement)) {
            return;
        }

        if (filteredFiles.length === 0) return;

        const selectedIndex = filteredFiles.findIndex(f => f.id === selectedFileId);

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (selectedIndex === -1) {
                // If current selection not in list, select last visible
                selectFile(filteredFiles[filteredFiles.length - 1].id);
            } else {
                const newIndex = Math.max(0, selectedIndex - 1);
                selectFile(filteredFiles[newIndex].id);
            }
        }
        else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (selectedIndex === -1) {
                // If current selection not in list, select first visible
                selectFile(filteredFiles[0].id);
            } else {
                const newIndex = Math.min(filteredFiles.length - 1, selectedIndex + 1);
                selectFile(filteredFiles[newIndex].id);
            }
        }
        else if (e.key === 'Delete') { // Backspace can be dangerous in browsers (nav back)
            if (selectedFileId) {
                e.preventDefault();
                closeFile(selectedFileId);
            }
        }
        else if (e.key === 'Enter') {
            // Already selected by arrow keys, but maybe we want to focus trace list?
            // For now, do nothing special as selection is immediate.
        }
    };
}

