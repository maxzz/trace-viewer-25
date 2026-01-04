import { useEffect, useRef, useMemo } from "react";
import { useSnapshot } from "valtio";
import { traceStore } from "../../../store/traces-store/0-state";
import { appSettings } from "../../../store/ui-settings";
import { ScrollArea } from "../../ui/shadcn/scroll-area";
import { FileListItem } from "./3-file-list-item";

export function FileList() {
    const { files, selectedFileId } = useSnapshot(traceStore);
    const { fileFilters, selectedFilterId } = useSnapshot(appSettings);
    const containerRef = useRef<HTMLDivElement>(null);

    // Compute filtered files
    const filteredFiles = useMemo(() => {
        if (!selectedFilterId) return files;
        const filter = fileFilters.find(f => f.id === selectedFilterId);
        if (!filter) return files;

        const pattern = filter.pattern.toLowerCase();
        
        // Convert glob to regex if contains *
        if (pattern.includes('*')) {
             try {
                const regexStr = "^" + pattern.split('*').map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + "$";
                const regex = new RegExp(regexStr, 'i');
                return files.filter(file => regex.test(file.fileName));
             } catch (e) {
                // fallback to contains
                return files.filter(file => file.fileName.toLowerCase().includes(pattern.replace(/\*/g, '')));
             }
        }
        
        return files.filter(file => file.fileName.toLowerCase().includes(pattern));
    }, [files, selectedFilterId, fileFilters]);

    // Keyboard navigation
    useEffect(
        () => {
            function handleKeyDown(e: KeyboardEvent) {
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
                         traceStore.selectFile(filteredFiles[filteredFiles.length - 1].id);
                    } else {
                        const newIndex = Math.max(0, selectedIndex - 1);
                        traceStore.selectFile(filteredFiles[newIndex].id);
                    }
                }
                else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (selectedIndex === -1) {
                        // If current selection not in list, select first visible
                        traceStore.selectFile(filteredFiles[0].id);
                    } else {
                        const newIndex = Math.min(filteredFiles.length - 1, selectedIndex + 1);
                        traceStore.selectFile(filteredFiles[newIndex].id);
                    }
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
        }, [filteredFiles, selectedFileId]
    );

    return (
        <div
            ref={containerRef}
            className="h-full flex flex-col bg-muted/10 select-none outline-none focus-visible:ring-1 focus-visible:ring-ring"
            tabIndex={0}
        >
            <ScrollArea className="flex-1" fixedWidth>
                <div className="flex flex-col py-1">
                    {filteredFiles.map(
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
