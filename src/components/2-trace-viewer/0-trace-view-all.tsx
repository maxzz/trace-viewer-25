import React, { useRef, useState, useEffect, useCallback } from "react";
import { useAtomValue, useAtom, atom, getDefaultStore, type PrimitiveAtom } from "jotai";
import { useSnapshot } from "valtio";
import { formatTimestamp } from "@/utils";
import { appSettings } from "../../store/1-ui-settings";
import { currentFileStateAtom } from "../../store/traces-store/0-files-current-state";
import { currentFileThreadFilterViewStateAtom } from "../../store/traces-store/2-thread-filter-cache";
import { type TraceLine } from "../../trace-viewer-core/9-core-types";
import { ITEM_HEIGHT } from "./9-trace-view-constants";
import { allTimesStore } from "../../store/traces-store/3-all-times-store";
import { TraceRowMemo } from "./1-trace-view-row";
import { handlePendingTimestampScroll, scrollToSelection } from "./2-trace-view-scroll";
import { handleKeyboardNavigation } from "./3-trace-view-keyboard";
import { SymbolArrowCircleLeft } from "../ui/icons/symbols/all-other/33-arrow-circle-left";

export function TraceList() {
    const currentFileState = useAtomValue(currentFileStateAtom);
    const { pendingScrollTimestamp, pendingScrollFileId } = useSnapshot(allTimesStore);
    const { useIconsForEntryExit, showLineNumbers, allTimes: { show: showOnAllTimes } } = useSnapshot(appSettings);

    // Derived from currentFileState
    const selectedFileId = currentFileState?.id ?? null;
    const fileData = currentFileState?.data;
    const currentLineIdxAtom = currentFileState?.currentLineIdxAtom ?? fallbackLineIndexAtom;
    const viewLines = fileData?.viewLines || [];

    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollTopAtom = currentFileState?.scrollTopAtom ?? fallbackScrollTopAtom;
    const [scrollTop, setScrollTop] = useAtom(scrollTopAtom);
    const [containerHeight, setContainerHeight] = useState(800); // Default
    const [hoveredTimestamp, setHoveredTimestamp] = useAtom(hoveredTimestampAtom);

    const { isThreadFilterActive, linesForView, threadIdsForView, threadLineBaseIndices, threadBaseIndexToDisplayIndex } = useAtomValue(currentFileThreadFilterViewStateAtom);

    const onMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            const target = e.target as HTMLElement;
            // Check if we are over the icon itself to prevent flickering
            if (target.closest('#trace-timestamp-icon')) return;

            const timestampDiv = target.closest('[data-timestamp]') as HTMLElement;
            if (timestampDiv && scrollRef.current) {
                const timestamp = timestampDiv.getAttribute('data-timestamp');
                if (timestamp) {
                    const rect = timestampDiv.getBoundingClientRect();
                    const containerRect = scrollRef.current.getBoundingClientRect();
                    setHoveredTimestamp({ timestamp, top: rect.top - containerRect.top, });
                    return;
                }
            }
            setHoveredTimestamp(null);
        },
        []);

    const onIconClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (hoveredTimestamp) {
                const precision = appSettings.allTimes.precision;
                const formatted = formatTimestamp(hoveredTimestamp.timestamp, precision);
                if (formatted) {
                    // Get date from the trace line if available and prepend it
                    const currentLine = viewLines.find(l => l.timestamp === hoveredTimestamp.timestamp);
                    const fullTimestamp = currentLine?.date ? `${currentLine.date} ${formatted}` : formatted;
                    
                    // Ensure panel is visible
                    if (!appSettings.allTimes.show) {
                        appSettings.allTimes.show = true;
                    }
                    
                    allTimesStore.setAllTimesSelectedTimestamp(fullTimestamp);
                }
            }
        },
        [hoveredTimestamp, viewLines]);

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
            if (!scrollRef.current) return;
            scrollRef.current.scrollTop = getDefaultStore().get(scrollTopAtom);
        },
        [selectedFileId, scrollTopAtom]);

    useEffect( // Handle pending timestamp scroll
        () => {
            handlePendingTimestampScroll(
                pendingScrollTimestamp,
                pendingScrollFileId,
                viewLines,
                scrollRef,
                containerHeight,
                selectedFileId,
                isThreadFilterActive ? (threadBaseIndexToDisplayIndex ?? undefined) : undefined
            );
        },
        [pendingScrollTimestamp, pendingScrollFileId, viewLines, containerHeight, selectedFileId, isThreadFilterActive, threadBaseIndexToDisplayIndex]);

    const onScroll = useCallback(
        (e: React.UIEvent<HTMLDivElement>) => {
            setScrollTop(e.currentTarget.scrollTop);
        },
        [setScrollTop]);

    const { totalHeight, visibleLines, offsetY, startIndex, firstLineLength } = calculateVirtualization(linesForView, containerHeight, scrollTop);

    return (
        <div
            ref={scrollRef}
            className="group/tracelist relative size-full outline-none overflow-auto"
            onScroll={onScroll}
            onMouseMove={showOnAllTimes ? onMouseMove : undefined}
            onMouseLeave={() => setHoveredTimestamp(null)}
            tabIndex={0}
        >
            {/* for styles debugging */}
            {/* <div className={iconContainerClasses} title="Locate in all times timeline">
                <SymbolArrowCircleLeft className={iconClasses} />
            </div> */}

            {/* Locate in Timeline icon */}
            {hoveredTimestamp && (
                <div
                    id="trace-timestamp-icon"
                    className={iconContainerClasses}
                    style={{ top: hoveredTimestamp.top + scrollTop + (ITEM_HEIGHT - 16) / 2 }}
                    title="Locate in all times timeline"
                    onClick={onIconClick}
                >
                    <SymbolArrowCircleLeft className={iconClasses} />
                </div>
            )}

            {/* Trace list */}
            <div style={{ height: totalHeight, position: 'relative' }}>
                <div style={{ transform: `translateY(${offsetY}px)` }}>
                    {visibleLines.map(
                        (line: TraceLine, idx: number) => (
                            <TraceRowMemo
                                key={line.lineIndex}
                                line={line}
                                baseIndex={getBaseIndexForDisplayIndex(isThreadFilterActive, threadLineBaseIndices, startIndex + idx)}
                                currentLineIdxAtom={currentLineIdxAtom}
                                useIconsForEntryExit={useIconsForEntryExit}
                                showLineNumbers={showLineNumbers}
                                uniqueThreadIds={threadIdsForView}
                                firstLineLength={firstLineLength}
                            />
                        )
                    )}
                </div>
            </div>

            {/* Scroll to selection controller */}
            <TraceViewScrollController
                scrollRef={scrollRef}
                containerHeight={containerHeight}
                selectedFileId={selectedFileId}
                currentLineIdxAtom={currentLineIdxAtom}
                isThreadFilterActive={isThreadFilterActive}
                threadBaseIndexToDisplayIndex={threadBaseIndexToDisplayIndex}
            />
        </div>
    );
}

const hoveredTimestampAtom = atom<{ timestamp: string; top: number; } | null>(null); // Atom to track hovered timestamp info
const fallbackLineIndexAtom = atom(-1);
const fallbackScrollTopAtom = atom(0);

function TraceViewScrollController({ scrollRef, containerHeight, selectedFileId, currentLineIdxAtom, isThreadFilterActive, threadBaseIndexToDisplayIndex }: {
    currentLineIdxAtom: PrimitiveAtom<number>;
    scrollRef: React.RefObject<HTMLDivElement | null>;
    containerHeight: number;
    selectedFileId: string | null;
    isThreadFilterActive: boolean;
    threadBaseIndexToDisplayIndex: number[] | undefined;
}) {
    const currentLineIndex = useAtomValue(currentLineIdxAtom);

    useEffect( // Scroll to selection
        () => {
            const displayIndex = isThreadFilterActive
                ? (threadBaseIndexToDisplayIndex?.[currentLineIndex] ?? -1)
                : currentLineIndex;
            scrollToSelection(displayIndex, scrollRef, containerHeight);
        },
        [currentLineIndex, containerHeight, isThreadFilterActive, selectedFileId, scrollRef, threadBaseIndexToDisplayIndex]);

    return null;
}

function calculateVirtualization(viewLines: TraceLine[], containerHeight: number, scrollTop: number) {
    // Virtualization logic
    const totalHeight = viewLines.length * ITEM_HEIGHT;
    // Calculate buffer based on visible items (50% of visible, minimum 20)
    // 01.08.2026: Increased buffer to avoid empty screen on fast scroll
    const BUFFER = Math.max(50, Math.floor(containerHeight / ITEM_HEIGHT * 2));
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
    const endIndex = Math.min(viewLines.length, Math.floor((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER);

    const visibleLines = viewLines.slice(startIndex, endIndex);
    const offsetY = startIndex * ITEM_HEIGHT;

    // determine firstLineLength from the first line that has a timestamp
    const firstLineLength = viewLines.find(l => !!l.timestamp)?.timestamp?.length ?? 12; // 12 is for 'HH:MM:SS.MSS' as oposite to higher precision 'HH:MM:SS.MSSSS'

    return { totalHeight, visibleLines, offsetY, startIndex, firstLineLength };
}

function getBaseIndexForDisplayIndex(isThreadFilterActive: boolean, displayIndexToBaseIndex: number[] | undefined, displayIndex: number) {
    if (!isThreadFilterActive) return displayIndex;
    return displayIndexToBaseIndex?.[displayIndex] ?? displayIndex;
}

const iconContainerClasses = "\
absolute left-1.25 size-4 z-20 \
hover:scale-125 \
\
rounded-full \
1shadow-sm \
border-border \
transition-transform \
cursor-pointer \
flex items-center justify-center";

const iconClasses = "\
size-full \
stroke-foreground/80 dark:stroke-foreground/80 \
hover:stroke-foreground dark:hover:stroke-foreground \
fill-background! \
";
