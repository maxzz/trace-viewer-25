import React, { useRef, useState, useEffect } from "react";
import { useSnapshot } from "valtio";
import { cn } from "@/utils";
import { traceStore } from "../../../store/trace-store";
import { appSettings } from "../../../store/ui-settings";
import { LineCode, type TraceLine } from "../../../trace-viewer-core/types";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { columnLineNumberClasses, columnTimeClasses, columnThreadIdClasses, lineClasses, lineCurrentClasses, lineNotCurrentClasses, lineErrorClasses } from "./8-classes";

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

const ITEM_HEIGHT = 24; // Fixed height for simplicity
const BUFFER = 20;

function getLineColor(line: TraceLine) {
    // Priority: Override Color > LineCode Color > Default
    if (line.textColor) {
        return undefined; // Handled by inline style
    }

    switch (line.code) {
        case LineCode.Error: return 'text-red-500 dark:text-red-400 font-bold';
        case LineCode.Entry: return 'text-blue-600 dark:text-blue-400';
        case LineCode.Exit: return 'text-blue-600 dark:text-blue-400';
        case LineCode.Time: return 'text-green-600 dark:text-green-400';
        case LineCode.Day: return 'text-purple-600 dark:text-purple-400 font-bold bg-purple-100 dark:bg-purple-900/30 w-full block';
        default: return 'text-foreground';
    }
}

function handleKeyboardNavigation(e: KeyboardEvent, containerHeight: number, scrollTop: number) {
    // Ignore if focus is in an input/textarea
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

const formatContent = (line: TraceLine, useIconsForEntryExit: boolean) => {
    if (useIconsForEntryExit) {
        if (line.code === LineCode.Entry) return <span className="flex items-center gap-1"><ArrowRight className="size-2 opacity-30" /> <span className="">{line.content}</span></span>;
        if (line.code === LineCode.Exit) return <span className="flex items-center gap-1"><ArrowLeft className="size-2 opacity-30" /> <span className="">{line.content}</span></span>;
    } else {
        if (line.code === LineCode.Entry) return `>>> ${line.content}`;
        if (line.code === LineCode.Exit) return `<<< ${line.content}`;
    }
    // if (line.code === LineCode.Entry) return `>>> ${line.content}`;
    // if (line.code === LineCode.Exit) return `<<< ${line.content}`;
    return line.content;
};

function getRowClasses(line: TraceLine, globalIndex: number, currentLineIndex: number) {
    const isCurrent = globalIndex === currentLineIndex;
    return cn(
        lineClasses,
        isCurrent ? lineCurrentClasses : lineNotCurrentClasses,
        line.code === LineCode.Error && !isCurrent && lineErrorClasses
    );
}

function renderRow(line: TraceLine, index: number, startIndex: number, currentLineIndex: number, useIconsForEntryExit: boolean, uniqueThreadIds: readonly number[]) {
    const globalIndex = startIndex + index;
    return (
        <div
            key={line.lineIndex}
            onClick={() => (traceStore.currentLineIndex = globalIndex)}
            className={getRowClasses(line, globalIndex, currentLineIndex)}
            style={{ height: ITEM_HEIGHT }}
        >
            {/* Line Number */}
            <span className={columnLineNumberClasses}>
                {line.lineIndex + 1}
            </span>

            {/* Time Column */}
            <span className={columnTimeClasses} title={line.timestamp}>
                {line.timestamp || ""}
            </span>

            {/* Thread ID */}
            <span className={cn(columnThreadIdClasses, "w-auto flex px-1")}>
                {uniqueThreadIds.map(tid => (
                    <div key={tid} className="relative w-3 h-full flex justify-center items-center" title={`Thread ${tid} (0x${tid.toString(16).toUpperCase()})`}>
                        <div className="absolute -top-1/2 -bottom-1/2 w-px bg-gray-300 dark:bg-gray-700" />
                        {tid === line.threadId && (
                            <div className="z-10 size-2 rounded-full border border-yellow-600 dark:border-yellow-500 bg-transparent" />
                        )}
                    </div>
                ))}
            </span>

            {/* Content with Indent */}
            <span
                className={cn("flex-1 truncate", line.textColor, getLineColor(line))}
                title={line.content}
                style={{ paddingLeft: `${line.indent * 12}px`, }}
            >
                {formatContent(line, useIconsForEntryExit)}
            </span>
        </div>
    );
}
