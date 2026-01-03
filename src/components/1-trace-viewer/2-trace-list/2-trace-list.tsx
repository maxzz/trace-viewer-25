import React, { useRef, useState, useEffect } from "react";
import { useSnapshot } from "valtio";
import { traceStore } from "../../../store/traces-store/0-state";
import { appSettings } from "../../../store/ui-settings";
import { ITEM_HEIGHT, renderRow } from "./3-trace-row";

export function TraceList() {
    const { viewLines, currentLineIndex, uniqueThreadIds } = useSnapshot(traceStore);
    const { useIconsForEntryExit } = useSnapshot(appSettings);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(800); // Default

    useEffect(() => {
        if (scrollRef.current) {
            const updateHeight = () => {
                if (scrollRef.current) {
                    setContainerHeight(scrollRef.current.clientHeight);
                }
            };

            updateHeight();
            window.addEventListener('resize', updateHeight);
            return () => window.removeEventListener('resize', updateHeight);
        }
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const controller = new AbortController();
        window.addEventListener('keydown', (e) => handleKeyboardNavigation(e, containerHeight, scrollTop), { signal: controller.signal });
        return () => controller.abort();
    }, [containerHeight, scrollTop]);

    // Scroll to selection
    useEffect(() => {
        if (currentLineIndex >= 0 && scrollRef.current) {
            const targetTop = currentLineIndex * ITEM_HEIGHT;
            const targetBottom = targetTop + ITEM_HEIGHT;
            const viewTop = scrollRef.current.scrollTop;
            const viewBottom = viewTop + containerHeight;

            if (targetTop < viewTop) {
                scrollRef.current.scrollTop = targetTop;
            } else if (targetBottom > viewBottom) {
                scrollRef.current.scrollTop = targetBottom - containerHeight;
            }
        }
    }, [currentLineIndex, containerHeight]);

    const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    };

    // Virtualization logic
    const totalHeight = viewLines.length * ITEM_HEIGHT;
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
    const endIndex = Math.min(viewLines.length, Math.floor((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER);

    const visibleLines = viewLines.slice(startIndex, endIndex);
    const offsetY = startIndex * ITEM_HEIGHT;

    return (
        <div ref={scrollRef} className="size-full overflow-auto relative" onScroll={onScroll}>
            <div style={{ height: totalHeight, position: 'relative' }}>
                <div style={{ transform: `translateY(${offsetY}px)` }}>
                    {visibleLines.map(
                        (line, index) => renderRow(line, index, startIndex, currentLineIndex, useIconsForEntryExit, uniqueThreadIds)
                    )}
                </div>
            </div>
        </div>
    );
}

const BUFFER = 20;

function handleKeyboardNavigation(e: KeyboardEvent, containerHeight: number, scrollTop: number) {
    // Ignore if focus is not in the scroll container
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
    }

    const totalLines = traceStore.viewLines.length;
    if (totalLines === 0) return;

    const currentIndex = traceStore.currentLineIndex;
    const linesPerPage = Math.floor(containerHeight / ITEM_HEIGHT);
    // Calculate current visible range based on scrollTop
    // Note: This might be slightly off due to BUFFER but gives good approximation for visual jumps
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
            if (e.altKey) {  // Changed from e.ctrlKey to e.altKey
                newIndex = firstVisibleIndex;
            } else {
                newIndex = Math.max(0, currentIndex - linesPerPage);
            }
            break;
        case 'PageDown':
            if (e.altKey) {  // Changed from e.ctrlKey to e.altKey
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
    if (newIndex !== currentIndex) {
        traceStore.currentLineIndex = newIndex;
    }
}
