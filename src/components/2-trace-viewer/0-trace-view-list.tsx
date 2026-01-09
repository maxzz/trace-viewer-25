import React, { useRef, useState, useEffect } from "react";
import { useSnapshot } from "valtio";
import { traceStore } from "../../store/traces-store/0-state";
import { appSettings } from "../../store/1-ui-settings";
import { ITEM_HEIGHT, renderRow } from "./1-trace-view-row";

export function TraceList() {
    const { viewLines, currentLineIndex, uniqueThreadIds, selectedFileId, pendingScrollTimestamp } = useSnapshot(traceStore);
    const { useIconsForEntryExit, showLineNumbers } = useSnapshot(appSettings);
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

    // Reset scroll on file change
    useEffect(() => {
        setScrollTop(0);
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [selectedFileId]);

    // Handle pending timestamp scroll
    useEffect(() => {
        if (!pendingScrollTimestamp || viewLines.length === 0) return;

        // Clean timestamp (remove date if present)
        // Expected formats: "MM/DD/YYYY HH:MM:SS.mmm" or "HH:MM:SS.mmm"
        let targetTimestampStr = pendingScrollTimestamp;
        if (targetTimestampStr.includes(' ')) {
            const parts = targetTimestampStr.split(' ');
            if (parts.length >= 2) {
                targetTimestampStr = parts[parts.length - 1];
            }
        }

        // Parse target timestamp to ms for accurate comparison
        const parseTime = (t: string) => {
            const [hms, msPart] = t.split('.');
            if (!hms) return 0;
            const [h, m, s] = hms.split(':').map(Number);
            // Pad milliseconds to ensure proper decimal comparison (e.g. .5 -> 500ms, .05 -> 50ms)
            const ms = parseInt((msPart || '').padEnd(3, '0').slice(0, 3), 10);
            return ((h || 0) * 3600 + (m || 0) * 60 + (s || 0)) * 1000 + (ms || 0);
        };

        const targetTime = parseTime(targetTimestampStr);
        let bestIndex = -1;
        let minDiff = Infinity;

        // Binary search for insertion point (first line >= targetTimestampStr)
        let low = 0;
        let high = viewLines.length - 1;
        let insertionIndex = viewLines.length;

        while (low <= high) {
            const mid = (low + high) >>> 1;
            const tStr = viewLines[mid].timestamp;
            if (!tStr) {
                low = mid + 1;
                continue;
            }
            // Use string comparison on cleaned timestamp
            if (tStr >= targetTimestampStr) {
                insertionIndex = mid;
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }

        // Priority 1: Check for prefix match (starts with) starting from insertionIndex
        // We look at insertionIndex because it's the first one >= target.
        // If it starts with target, it's the perfect match (e.g. 690 starts with 69).
        if (insertionIndex < viewLines.length) {
             const tStr = viewLines[insertionIndex].timestamp;
             if (tStr && tStr.startsWith(targetTimestampStr)) {
                 bestIndex = insertionIndex;
             }
        }

        // Priority 2: If no prefix match, look for closest by time difference
        if (bestIndex === -1) {
            const candidates = [];
            const range = 5;
            for (let i = Math.max(0, insertionIndex - range); i <= Math.min(viewLines.length - 1, insertionIndex + range); i++) {
                candidates.push(i);
            }

            for (const idx of candidates) {
                const tStr = viewLines[idx].timestamp;
                if (tStr) {
                    const tVal = parseTime(tStr);
                    const diff = Math.abs(tVal - targetTime);
                    if (diff < minDiff) {
                        minDiff = diff;
                        bestIndex = idx;
                    }
                }
            }
        }

        // Apply selection
        if (bestIndex !== -1) {
            traceStore.currentLineIndex = bestIndex;
            // Force scroll to this index even if it was already selected?
            // The scroll effect depends on currentLineIndex change.
            // If bestIndex === currentLineIndex, the other effect won't fire unless we force it.
            // But we can manually trigger scroll here if we want to be sure.
            
            // Actually, simply setting it might not trigger effect if value is same.
            // But if user clicked timeline, they expect to see it. 
            // We can add a "forceScroll" flag or just rely on the fact that usually we are navigating to a new place.
            // If we are already there, maybe scrolling is not needed?
            // The user complaint says "no scroll but it should be". This implies it IS out of view but didn't scroll.
            // This happens if currentLineIndex was ALREADY bestIndex, so state didn't change, so useEffect didn't fire.
            
            // To fix: we can trigger a scroll imperatively here.
             if (scrollRef.current) {
                const targetTop = bestIndex * ITEM_HEIGHT;
                const targetBottom = targetTop + ITEM_HEIGHT;
                const viewTop = scrollRef.current.scrollTop;
                const viewBottom = viewTop + containerHeight; // containerHeight is from state, might be stale? No, it's updated on resize.

                if (targetTop < viewTop) {
                    scrollRef.current.scrollTop = targetTop;
                } else if (targetBottom > viewBottom) {
                    scrollRef.current.scrollTop = targetBottom - containerHeight;
                }
            }
        }

        // Clear pending timestamp
        traceStore.pendingScrollTimestamp = null;

    }, [pendingScrollTimestamp, viewLines]);

    // Keyboard navigation
    useEffect(() => {
        const controller = new AbortController();
        window.addEventListener('keydown',
            (e) => {
                // Check focus: allow if body is focused OR focus is within this component
                // This prevents conflict with FileList navigation
                const isFocused = document.activeElement === document.body || scrollRef.current?.contains(document.activeElement);

                if (isFocused) {
                    handleKeyboardNavigation(e, containerHeight, scrollTop);
                }
            }, { signal: controller.signal }
        );
        return () => controller.abort();
    }, [containerHeight, scrollTop]);

    // Scroll to selection
    useEffect(() => {
        if (currentLineIndex >= 0 && scrollRef.current) {
            const targetTop = currentLineIndex * ITEM_HEIGHT;
            const targetBottom = targetTop + ITEM_HEIGHT;
            const viewTop = scrollRef.current.scrollTop;
            const viewBottom = viewTop + containerHeight;

            // If we are handling a pending scroll (just processed), we might want to center or force scroll.
            // But standard behavior: ensure visible.
            
            if (targetTop < viewTop) {
                scrollRef.current.scrollTop = targetTop;
            } else if (targetBottom > viewBottom) {
                scrollRef.current.scrollTop = targetBottom - containerHeight;
            }
        }
        // pendingScrollTimestamp is cleared in the other effect, but we want to ensure this runs 
        // after that calculation updates currentLineIndex. 
        // Since that effect updates currentLineIndex, this effect will trigger naturally.
    }, [currentLineIndex, containerHeight, selectedFileId]);


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
        <div
            ref={scrollRef}
            className="size-full overflow-auto relative outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring"
            onScroll={onScroll}
            tabIndex={0}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                <div style={{ transform: `translateY(${offsetY}px)` }}>
                    {visibleLines.map(
                        (line, index) => renderRow(line, index, startIndex, currentLineIndex, useIconsForEntryExit, showLineNumbers, uniqueThreadIds)
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
    if (newIndex !== currentIndex) {
        traceStore.currentLineIndex = newIndex;
    }
}
