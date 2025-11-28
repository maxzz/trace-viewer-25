import { traceStore } from "../../../store/trace-store";
import { LineCode, type TraceLine } from "../../../trace-viewer-core/types";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/utils";
import {
    columnLineNumberClasses,
    columnTimeClasses,
    columnThreadIdClasses,
    lineClasses,
    lineCurrentClasses,
    lineNotCurrentClasses,
    lineErrorClasses
} from "./8-classes";

export const ITEM_HEIGHT = 20; // Fixed height for simplicity. was 24

export function renderRow(line: TraceLine, index: number, startIndex: number, currentLineIndex: number, useIconsForEntryExit: boolean, uniqueThreadIds: readonly number[]) {
    const globalIndex = startIndex + index;
    const showThreadBackground = uniqueThreadIds.length > 0 && uniqueThreadIds[0] !== line.threadId;
    
    return (
        <div
            key={line.lineIndex}
            onClick={() => (traceStore.currentLineIndex = globalIndex)}
            className={getRowClasses(line, globalIndex, currentLineIndex)}
            style={{ height: ITEM_HEIGHT }}
        >
            {/* Line Number */}
            <div className={columnLineNumberClasses}>
                {line.lineIndex + 1}
            </div>

            {/* Time Column */}
            <div className={columnTimeClasses} title={line.timestamp}>
                {line.timestamp || ""}
            </div>

            {/* Thread ID */}
            <div className={cn(columnThreadIdClasses, "w-auto h-full flex px-1", globalIndex === currentLineIndex ? "" : "bg-muted/40")}>
                {uniqueThreadIds.map((tid) => {
                    const color = getThreadColor(tid);
                    return (
                        <div key={tid} className="relative w-3 h-full flex justify-center items-center" title={`Thread ${tid} (0x${tid.toString(16).toUpperCase()})`}>
                            <div 
                                className="absolute w-px -top-1/2 -bottom-1/2 border-l"
                                style={{ borderLeftColor: color, opacity: 0.5 }} 
                            />
                            {tid === line.threadId && (
                                <div 
                                    className="size-2 bg-transparent border rounded-full z-10" 
                                    style={{ borderColor: color }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Content with Indent */}
            <div
                className={cn("flex-1 h-full truncate flex items-center", line.textColor, getLineColor(line))}
                title={line.content}
                style={{ 
                    paddingLeft: `${line.indent * 12}px`, 
                    backgroundColor: showThreadBackground ? getThreadColor(line.threadId, 0.1) : undefined  //0.05
                }}
            >
                {formatContent(line, useIconsForEntryExit)}
            </div>
        </div>
    );
}

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

const formatContent = (line: TraceLine, useIconsForEntryExit: boolean) => {
    // ↳ ↲
    if (useIconsForEntryExit) {
        // if (line.code === LineCode.Entry) return <span className="flex items-center gap-1"><ArrowRight className="size-2 opacity-30" /> <span className="">{line.content}</span></span>;
        // if (line.code === LineCode.Exit) return <span className="flex items-center gap-1"><ArrowLeft className="size-2 opacity-30" /> <span className="">{line.content}</span></span>;
        if (line.code === LineCode.Entry) return <span><span className="opacity-30">→ </span>{line.content}</span>;
        if (line.code === LineCode.Exit) return <span><span className="opacity-30">← </span>{line.content}</span>;
    } else {
        if (line.code === LineCode.Entry) return `>>> ${line.content}`;
        if (line.code === LineCode.Exit) return `<<< ${line.content}`;
    }
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

function getThreadColor(tid: number, alpha = 1) {
    const hue = (Math.abs(tid) * 137.508) % 360;
    return `hsla(${hue}, 75%, 50%, ${alpha})`;
}
