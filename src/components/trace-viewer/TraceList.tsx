import React, { useRef, useState, useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { traceStore } from '../../store/trace-store';
import { LineCode, type TraceLine } from '../../trace-viewer-core/types';
import { ScrollArea } from '../ui/shadcn/scroll-area';
import { cn } from '../../lib/utils';

const ITEM_HEIGHT = 24; // Fixed height for simplicity
const BUFFER = 20;

export const TraceList: React.FC = () => {
    const { lines } = useSnapshot(traceStore);
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

    const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    };

    // Virtualization logic
    const totalHeight = lines.length * ITEM_HEIGHT;
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
    const endIndex = Math.min(lines.length, Math.floor((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER);
    
    const visibleLines = lines.slice(startIndex, endIndex);
    const offsetY = startIndex * ITEM_HEIGHT;

    const getLineColor = (code: LineCode) => {
        switch (code) {
            case LineCode.Error: return 'text-red-500 dark:text-red-400 font-bold';
            case LineCode.Entry: return 'text-blue-600 dark:text-blue-400';
            case LineCode.Exit: return 'text-blue-600 dark:text-blue-400';
            case LineCode.Time: return 'text-green-600 dark:text-green-400';
            case LineCode.Day: return 'text-purple-600 dark:text-purple-400 font-bold bg-purple-100 dark:bg-purple-900/30 w-full block';
            default: return 'text-foreground';
        }
    };

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
                    {visibleLines.map((line) => (
                        <div 
                            key={line.lineIndex} 
                            className={cn(
                                "flex items-center text-xs font-mono hover:bg-gray-100 dark:hover:bg-gray-800 px-2 whitespace-pre",
                                line.code === LineCode.Error && "bg-red-50 dark:bg-red-900/20"
                            )}
                            style={{ height: ITEM_HEIGHT }}
                        >
                            {/* Line Number */}
                            <span className="w-16 text-gray-400 shrink-0 select-none">
                                {line.lineIndex + 1}
                            </span>

                            {/* Thread ID */}
                            <span className="w-20 text-yellow-600 dark:text-yellow-500 shrink-0 select-none" title={`Thread ${line.threadId}`}>
                                {line.threadId.toString(16).toUpperCase().padStart(4, '0')}
                            </span>

                            {/* Content with Indent */}
                            <span 
                                className={cn("flex-1 truncate", getLineColor(line.code))}
                                style={{ paddingLeft: `${line.indent * 12}px` }}
                            >
                                {formatContent(line)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

