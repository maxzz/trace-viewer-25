import React from "react";
import { traceStore } from "../../store/traces-store/0-state";
import { ITEM_HEIGHT } from "./9-trace-view-constants";

export function handleKeyboardNavigation(e: KeyboardEvent, scrollRef: React.RefObject<HTMLDivElement | null>, containerHeight: number, scrollTop: number) {
    // Check focus: allow if body is focused OR focus is within this component
    // This prevents conflict with FileList navigation
    const isFocused = document.activeElement === document.body || scrollRef.current?.contains(document.activeElement);
    if (!isFocused) {
        return;
    }
    
    // Ignore if focus is not in the scroll container
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
    }

    const totalLines = traceStore.currentFileState?.fileData.viewLines.length ?? 0;
    if (totalLines === 0) return;

    const currentIndex = traceStore.currentFileState?.fileState.currentLineIndex ?? -1;
    const linesPerPage = Math.floor(containerHeight / ITEM_HEIGHT);
    
    // Calculate current visible range based on scrollTop
    const firstVisibleIndex = Math.floor(scrollTop / ITEM_HEIGHT);
    const lastVisibleIndex = Math.min(totalLines - 1, firstVisibleIndex + linesPerPage - 1);

    let newIndex = currentIndex;

    switch (e.key) {
        case 'ArrowUp':
            newIndex = Math.max(0, currentIndex - 1);
            break;
        case 'ArrowDown':
            newIndex = currentIndex === -1 ? 0 : Math.min(totalLines - 1, currentIndex + 1);
            break;
        case 'PageUp':
            if (e.altKey) {
                newIndex = firstVisibleIndex;
            } else {
                newIndex = Math.max(0, currentIndex - linesPerPage);
            }
            break;
        case 'PageDown':
            if (e.altKey) {
                newIndex = lastVisibleIndex;
            } else {
                const start = currentIndex === -1 ? 0 : currentIndex;
                newIndex = Math.min(totalLines - 1, start + linesPerPage);
            }
            break;
        case 'Home':
            newIndex = 0;
            break;
        case 'End':
            newIndex = totalLines - 1;
            break;
        default:
            return;
    }

    e.preventDefault();
    if (newIndex !== currentIndex && traceStore.currentFileState) {
        traceStore.currentFileState.fileState.currentLineIndex = newIndex;
    }
}
