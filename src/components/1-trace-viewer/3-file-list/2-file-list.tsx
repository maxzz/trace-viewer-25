import { useEffect, useRef } from "react";
import { useSnapshot } from "valtio";
import { traceStore } from "../../../store/traces-store/0-state";
import { ScrollArea } from "../../ui/shadcn/scroll-area";
import { FileListItem } from "./3-file-list-item";

export function FileList() {
    const { files, selectedFileId } = useSnapshot(traceStore);
    const containerRef = useRef<HTMLDivElement>(null);

    // Keyboard navigation
    useEffect(
        () => {
            function handleKeyDown(e: KeyboardEvent) {
                // Only handle if focus is within this component
                if (!containerRef.current?.contains(document.activeElement)) {
                    return;
                }

                if (files.length === 0) return;

                const selectedIndex = files.findIndex(f => f.id === selectedFileId);

                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const newIndex = Math.max(0, selectedIndex - 1);
                    traceStore.selectFile(files[newIndex].id);
                }
                else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const newIndex = selectedIndex === -1 ? 0 : Math.min(files.length - 1, selectedIndex + 1);
                    traceStore.selectFile(files[newIndex].id);
                }
                else if (e.key === 'Delete') { // Backspace can be dangerous in browsers (nav back)
                    if (selectedFileId) {
                        e.preventDefault();
                        traceStore.closeFile(selectedFileId);
                    }
                }
                else if (e.key === 'Enter') {
                    // Already selected by arrow keys, but maybe we want to focus trace list?
                    // For now, do nothing special as selection is immediate.
                }
            }

            const controller = new AbortController();
            window.addEventListener('keydown', handleKeyDown, { signal: controller.signal });
            return () => controller.abort();
        }, [files, selectedFileId]
    );

    return (
        <div
            ref={containerRef}
            className="h-full flex flex-col bg-muted/10 select-none outline-none focus-visible:ring-1 focus-visible:ring-ring"
            tabIndex={0}
        >
            <ScrollArea className="flex-1" fixedWidth>
                <div className="flex flex-col py-1">
                    {files.map(
                        (file) => (
                            <FileListItem
                                key={file.id}
                                file={file as any}
                                isSelected={file.id === selectedFileId}
                                onClick={() => traceStore.selectFile(file.id)}
                            />
                        )
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
