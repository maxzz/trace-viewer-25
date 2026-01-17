import React, { useRef, useState, useEffect, useCallback } from "react";
import { useAtomValue, atom, type PrimitiveAtom } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "../../store/1-ui-settings";
import { currentFileStateAtom } from "../../store/traces-store/0-files-current-state";
import { type TraceLine } from "../../trace-viewer-core/9-core-types";
import { ITEM_HEIGHT } from "./9-trace-view-constants";
import { allTimesStore } from "../../store/traces-store/3-all-times-store";
import { TraceRowMemo } from "./1-trace-view-row";
import { handlePendingTimestampScroll, scrollToSelection } from "./2-trace-view-scroll";
import { handleKeyboardNavigation } from "./3-trace-view-keyboard";

export function TraceList() {
    const currentFileState = useAtomValue(currentFileStateAtom);
    const { pendingScrollTimestamp, pendingScrollFileId } = useSnapshot(allTimesStore);
    const { useIconsForEntryExit, showLineNumbers } = useSnapshot(appSettings);

    // Derived from currentFileState
    const selectedFileId = currentFileState?.id ?? null;
    const fileData = currentFileState?.data;
    const currentLineIdxAtom = currentFileState?.currentLineIdxAtom ?? fallbackLineIndexAtom;
    const viewLines = fileData?.viewLines || [];
    const threadIds = fileData?.uniqueThreadIds || [];

    const scrollRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(800); // Default

    useEffect( // Keyboard navigation
        () => {
            const controller = new AbortController();
            window.addEventListener('keydown', (e) => handleKeyboardNavigation(e, scrollRef, containerHeight, scrollTop), { signal: controller.signal });
            return () => controller.abort();
        },
        [containerHeight, scrollTop]);

    useEffect( // Update container height on resize
        () => {
            if (!scrollRef.current) return;

            function updateHeight() {
                scrollRef.current && setContainerHeight(scrollRef.current.clientHeight);
            }
            updateHeight();

            const controller = new AbortController();
            window.addEventListener('resize', updateHeight, { signal: controller.signal });
            return () => controller.abort();
        },
        []);

    useEffect( // Reset scroll on file change
        () => {
            setScrollTop(0);
            scrollRef.current && (scrollRef.current.scrollTop = 0);
        },
        [selectedFileId]);

    useEffect( // Handle pending timestamp scroll
        () => {
            handlePendingTimestampScroll(pendingScrollTimestamp, pendingScrollFileId, viewLines, scrollRef, containerHeight, selectedFileId);
        },
        [pendingScrollTimestamp, pendingScrollFileId, viewLines, containerHeight, selectedFileId]);

    const onScroll = useCallback(
        (e: React.UIEvent<HTMLDivElement>) => {
            setScrollTop(e.currentTarget.scrollTop);
        },
        []);

    // Virtualization logic
    const totalHeight = viewLines.length * ITEM_HEIGHT;
    // Calculate buffer based on visible items (50% of visible, minimum 20)
    // 08.01.2026: Increased buffer to avoid empty screen on fast scroll
    const BUFFER = Math.max(50, Math.floor(containerHeight / ITEM_HEIGHT * 2));
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
    const endIndex = Math.min(viewLines.length, Math.floor((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER);

    const visibleLines = viewLines.slice(startIndex, endIndex);
    const offsetY = startIndex * ITEM_HEIGHT;

    // determine firstLineLength from the first line that has a timestamp
    const firstLineLength = viewLines.find(l => !!l.timestamp)?.timestamp?.length ?? 12; // 12 is for 'HH:MM:SS.MSS' as oposite to higher precision 'HH:MM:SS.MSSSS'

    return (
        <div
            ref={scrollRef}
            className="group/tracelist relative size-full outline-none overflow-auto"
            onScroll={onScroll}
            tabIndex={0}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                <div style={{ transform: `translateY(${offsetY}px)` }}>
                    {visibleLines.map(
                        (line: TraceLine, idx: number) => (
                            <TraceRowMemo
                                key={line.lineIndex}
                                line={line}
                                globalIndex={startIndex + idx}
                                currentLineIdxAtom={currentLineIdxAtom}
                                useIconsForEntryExit={useIconsForEntryExit}
                                showLineNumbers={showLineNumbers}
                                uniqueThreadIds={threadIds}
                                firstLineLength={firstLineLength}
                            />
                        )
                    )}
                </div>
            </div>

            <TraceViewScrollController
                scrollRef={scrollRef}
                containerHeight={containerHeight}
                selectedFileId={selectedFileId}
                currentLineIdxAtom={currentLineIdxAtom}
            />
        </div>
    );
}

const fallbackLineIndexAtom = atom(-1);

function TraceViewScrollController({ scrollRef, containerHeight, selectedFileId, currentLineIdxAtom }: {
    currentLineIdxAtom: PrimitiveAtom<number>;
    scrollRef: React.RefObject<HTMLDivElement | null>;
    containerHeight: number;
    selectedFileId: string | null;
}) {
    const currentLineIndex = useAtomValue(currentLineIdxAtom);

    useEffect( // Scroll to selection
        () => {
            scrollToSelection(currentLineIndex, scrollRef, containerHeight);
        },
        [currentLineIndex, containerHeight, selectedFileId]);

    return null;
}
