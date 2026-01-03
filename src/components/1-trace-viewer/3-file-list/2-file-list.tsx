import React, { useEffect, useRef } from "react";
import { useSnapshot } from "valtio";
import { traceStore } from "../../../store/traces-store/0-state";
import { ScrollArea } from "../../ui/shadcn/scroll-area";
import { FileListItem } from "./3-file-list-item";

export function FileList() {
    const { files, selectedFileId } = useSnapshot(traceStore);
    const containerRef = useRef<HTMLDivElement>(null);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
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
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const newIndex = selectedIndex === -1 ? 0 : Math.min(files.length - 1, selectedIndex + 1);
                traceStore.selectFile(files[newIndex].id);
            } else if (e.key === 'Delete') { // Backspace can be dangerous in browsers (nav back)
                if (selectedFileId) {
                    e.preventDefault();
                    traceStore.closeFile(selectedFileId);
                }
            } else if (e.key === 'Enter') {
                // Already selected by arrow keys, but maybe we want to focus trace list?
                // For now, do nothing special as selection is immediate.
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [files, selectedFileId]);

    return (
        <div 
            className="h-full flex flex-col bg-muted/10 select-none outline-none focus-visible:ring-1 focus-visible:ring-ring" 
            ref={containerRef}
            tabIndex={0}
        >
             <div className="h-10 px-3 border-b flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span className="tracking-wide">OPEN FILES</span>
                <span className="bg-muted-foreground/10 px-1.5 py-0.5 rounded text-[10px]">{files.length}</span>
             </div>
             <ScrollArea className="flex-1">
                <div className="flex flex-col py-1">
                    {files.map(file => (
                        <FileListItem 
                            key={file.id} 
                            file={file as any} 
                            isSelected={file.id === selectedFileId}
                            onClick={() => traceStore.selectFile(file.id)}
                        />
                    ))}
                </div>
             </ScrollArea>
        </div>
    );
}
