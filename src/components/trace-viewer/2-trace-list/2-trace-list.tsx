import React, { useRef, useState, useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { traceStore } from '../../../store/trace-store';
import { LineCode, type TraceLine } from '../../../trace-viewer-core/types';
import { cn } from '@/utils';

const ITEM_HEIGHT = 24; // Fixed height for simplicity
const BUFFER = 20;

const getLineColor = (line: TraceLine) => {
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
};

const handleTraceNavigation = (e: KeyboardEvent, containerHeight: number) => {
    // Ignore if focus is in an input/textarea
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
    }

    const totalLines = traceStore.lines.length;
    if (totalLines === 0) return;

    const currentIndex = traceStore.currentLineIndex;
    const linesPerPage = Math.floor(containerHeight / ITEM_HEIGHT);
    let newIndex = currentIndex;

    switch (e.key) {
        case 'ArrowUp':
            newIndex = Math.max(0, currentIndex - 1);
            break;
        case 'ArrowDown':
            newIndex = currentIndex === -1 ? 0 : Math.min(totalLines - 1, currentIndex + 1);
            break;
        case 'PageUp':
            newIndex = Math.max(0, currentIndex - linesPerPage);
            break;
        case 'PageDown':
            const start = currentIndex === -1 ? 0 : currentIndex;
            newIndex = Math.min(totalLines - 1, start + linesPerPage);
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
};

export function TraceList() {
    const { lines, currentLineIndex } = useSnapshot(traceStore);
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
        window.addEventListener(
            'keydown', 
            (e) => handleTraceNavigation(e, containerHeight), 
            { signal: controller.signal }
        );
        return () => controller.abort();
    }, [containerHeight]);

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
    const totalHeight = lines.length * ITEM_HEIGHT;
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
    const endIndex = Math.min(lines.length, Math.floor((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER);

    const visibleLines = lines.slice(startIndex, endIndex);
    const offsetY = startIndex * ITEM_HEIGHT;

    const formatContent = (line: TraceLine) => {
        if (line.code === LineCode.Entry) return `>>> ${line.content}`;
        if (line.code === LineCode.Exit) return `<<< ${line.content}`;
        return line.content;
    };

    return (
        <div
            ref={scrollRef}
            className="h-full w-full overflow-auto relative"
            onScroll={onScroll}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                <div style={{ transform: `translateY(${offsetY}px)` }}>
                    {visibleLines.map(
                        (line) => (
                            <div
                                key={line.lineIndex}
                                onClick={() => (traceStore.currentLineIndex = line.lineIndex)}
                                className={cn(
                                    "flex items-center text-xs font-mono cursor-pointer px-2 whitespace-pre border-l-4",
                                    line.lineIndex === currentLineIndex 
                                        ? "bg-blue-100 dark:bg-blue-900 border-blue-500"
                                        : "hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent",
                                    line.code === LineCode.Error && line.lineIndex !== currentLineIndex && "bg-red-50 dark:bg-red-900/20"
                                )}
                                style={{ height: ITEM_HEIGHT }}
                            >
                                {/* Line Number */}
                                <span className="w-16 text-gray-400 shrink-0 select-none text-right pr-2 border-r border-gray-200 dark:border-gray-800 mr-2">
                                    {line.lineIndex + 1}
                                </span>

                                {/* Time Column */}
                                <span className="w-24 text-gray-500 shrink-0 select-none tabular-nums border-r border-gray-200 dark:border-gray-800 mr-2 truncate" title={line.timestamp}>
                                    {line.timestamp || ""}
                                </span>

                                {/* Thread ID */}
                                <span className="w-16 text-yellow-600 dark:text-yellow-500 shrink-0 select-none border-r border-gray-200 dark:border-gray-800 mr-2" title={`Thread ${line.threadId}`}>
                                    {line.threadId.toString(16).toUpperCase().padStart(4, '0')}
                                </span>

                                {/* Content with Indent */}
                                <span
                                    className={cn("flex-1 truncate", line.textColor, getLineColor(line))}
                                    style={{
                                        paddingLeft: `${line.indent * 12}px`,
                                    }}
                                >
                                    {formatContent(line)}
                                </span>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
