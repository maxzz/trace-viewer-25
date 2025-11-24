import React, { useRef, useState, useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { traceStore } from '../../../store/trace-store';
import { LineCode, type TraceLine } from '../../../trace-viewer-core/types';
import { cn } from '@/utils';

const formatContent = (line: TraceLine) => {
    if (line.code === LineCode.Entry) return `>>> ${line.content}`;
    if (line.code === LineCode.Exit) return `<<< ${line.content}`;
    return line.content;
};

function renderRow(line: TraceLine, index: number, startIndex: number, currentLineIndex: number) {
    const globalIndex = startIndex + index;
    return (
        <div
            key={line.lineIndex}
            onClick={() => (traceStore.currentLineIndex = globalIndex)}
            className={cn(
                lineClasses,
                globalIndex === currentLineIndex ? lineCurrentClasses : lineNotCurrentClasses,
                line.code === LineCode.Error && globalIndex !== currentLineIndex && "bg-red-50 dark:bg-red-900/20"
            )}
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
            <span className={columnThreadIdClasses} title={`Thread ${line.threadId}`}>
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
    );
}

export function TraceList() {
    const { viewLines, currentLineIndex } = useSnapshot(traceStore);
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
        window.addEventListener('keydown', (e) => handleKeyboardNavigation(e, containerHeight), { signal: controller.signal });
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
    const totalHeight = viewLines.length * ITEM_HEIGHT;
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
    const endIndex = Math.min(viewLines.length, Math.floor((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER);

    const visibleLines = viewLines.slice(startIndex, endIndex);
    const offsetY = startIndex * ITEM_HEIGHT;

    return (
        <div ref={scrollRef} className="h-full w-full overflow-auto relative" onScroll={onScroll}>
            <div style={{ height: totalHeight, position: 'relative' }}>
                <div style={{ transform: `translateY(${offsetY}px)` }}>
                    {visibleLines.map((line, index) => renderRow(line, index, startIndex, currentLineIndex))}
                </div>
            </div>
        </div>
    );
}

const lineClasses = "flex items-center text-xs font-mono cursor-pointer px-2 whitespace-pre border-l-4";
const lineCurrentClasses = "bg-blue-100 dark:bg-blue-900 border-blue-500";
const lineNotCurrentClasses = "hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent";

const columnLineNumberClasses = "w-16 text-gray-400 shrink-0 select-none text-right pr-2 border-r border-gray-200 dark:border-gray-800 mr-2";
const columnTimeClasses = "w-24 text-gray-500 shrink-0 select-none tabular-nums border-r border-gray-200 dark:border-gray-800 mr-2 truncate";
const columnThreadIdClasses = "w-16 text-yellow-600 dark:text-yellow-500 shrink-0 select-none border-r border-gray-200 dark:border-gray-800 mr-2";

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

function handleKeyboardNavigation(e: KeyboardEvent, containerHeight: number) {
    // Ignore if focus is in an input/textarea
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
    }

    const totalLines = traceStore.viewLines.length;
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
}
