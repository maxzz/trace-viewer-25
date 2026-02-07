import React from "react";
import { setCurrentLineIndex } from "../../store/traces-store/0-files-current-state";
import { allTimesStore } from "../../store/traces-store/3-all-times-store";
import { type TraceLine } from "@/trace-viewer-core/9-core-types";
import { ITEM_HEIGHT } from "./9-trace-view-constants";

export function scrollToSelection(currentLineIndex: number, scrollRef: React.RefObject<HTMLDivElement | null>, containerHeight: number) {
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
}

export function handlePendingTimestampScroll(
    pendingScrollTimestamp: string | null,
    pendingScrollFileId: string | null | undefined,
    viewLines: readonly TraceLine[],
    scrollRef: React.RefObject<HTMLDivElement | null>,
    containerHeight: number,
    currentFileId: string | null,
    baseIndexToDisplayIndex?: readonly number[]
) {
    if (!pendingScrollTimestamp || viewLines.length === 0) return;

    // If pending scroll is for a specific file, ensure we are on that file
    if (pendingScrollFileId && pendingScrollFileId !== currentFileId) {
        return;
    }

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
        setCurrentLineIndex(bestIndex);
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
            const displayIndex = baseIndexToDisplayIndex ? (baseIndexToDisplayIndex[bestIndex] ?? -1) : bestIndex;
            if (displayIndex < 0) {
                // line is currently filtered out, let selection change stand and skip scroll
                allTimesStore.pendingScrollTimestamp = null;
                allTimesStore.pendingScrollFileId = null;
                return;
            }

            const targetTop = displayIndex * ITEM_HEIGHT;
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
    allTimesStore.pendingScrollTimestamp = null;
    allTimesStore.pendingScrollFileId = null;
}
