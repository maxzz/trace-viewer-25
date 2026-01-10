import { useSetAtom, useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { cn } from "@/utils/index";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger, } from "../ui/shadcn/context-menu";
import { appSettings } from "@/store/1-ui-settings";
import { type TraceFile } from "../../store/traces-store/2-files-store";
import { traceStore } from "../../store/traces-store/0-state";
import { AlertCircle, FileText } from "lucide-react";
import { dialogFileHeaderOpenAtom } from "@/store/2-ui-atoms";

export function FileListRow({ file, isSelected }: { file: TraceFile; isSelected: boolean; }) {
    const hasError = file.errorCount > 0 || !!file.error;
    const { highlightRules, highlightEnabled } = useSnapshot(appSettings);
    const { fullTimeline: timeline, fullTimelineSelectedTimestamp: selectedTimelineTimestamp } = useSnapshot(traceStore);
    const setFileHeaderOpen = useSetAtom(dialogFileHeaderOpenAtom);
    const matchedHighlightIds = useAtomValue(file.matchedHighlightIdsAtom);

    let highlightColor = undefined;
    if (highlightEnabled && matchedHighlightIds && matchedHighlightIds.length > 0) {
        // Find the first rule in appSettings that matches one of the file's matched IDs
        // We iterate through highlightRules to preserve order priority
        const rule = highlightRules.find(r => matchedHighlightIds.includes(r.id));
        if (rule && rule.color) {
            highlightColor = rule.color;
        }
    }

    const isMarked = selectedTimelineTimestamp
        ? timeline.find(t => t.timestamp === selectedTimelineTimestamp)?.fileIds.includes(file.id)
        : false;

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <div className={getRowClasses(isSelected, hasError)} onClick={() => traceStore.selectFile(file.id)}>
                    {/* Highlight Background Layer */}
                    {!isSelected && highlightColor && (
                        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundColor: `var(--color-${highlightColor})` }} />
                    )}

                    {/* File icon */}
                    <div className="relative shrink-0 z-10">
                        <FileText className={cn("size-4", isSelected ? "text-primary" : "opacity-70", hasError && "text-red-600 dark:text-red-400")} />

                        {file.errorCount === 0 && !!file.error && (
                            <div className="absolute -top-1 -right-1 bg-background rounded-full">
                                <AlertCircle className="size-3 text-red-500 fill-background" />
                            </div>
                        )}

                        {/* Error count badge */}
                        {file.errorCount > 0 && (
                            <span className={errorCountBadgeClasses}>
                                {file.errorCount}
                            </span>
                        )}
                    </div>

                    {/* File name */}
                    <span className="flex-1 truncate z-10" title={file.fileName}>
                        {file.fileName}
                    </span>

                    {/* Loading indicator */}
                    {file.isLoading && (
                        <span className="size-2 rounded-full bg-blue-500 animate-pulse shrink-0 z-10" />
                    )}

                    {/* Timeline Marker */}
                    {isMarked && (
                        <div
                            className="ml-auto shrink-0 z-10 hover:scale-125 transition-transform"
                            onClick={(e) => {
                                e.stopPropagation();
                                traceStore.selectFile(file.id);
                                traceStore.scrollToTimestamp(selectedTimelineTimestamp);
                            }}
                        >
                            <div className="size-2 rounded-full bg-green-500 ring-1 ring-background" title="Present in selected timeline" />
                        </div>
                    )}
                </div>
            </ContextMenuTrigger>

            <ContextMenuContent>
                <ContextMenuItem onClick={() => {
                    // traceStore.selectFile(file.id);
                    setFileHeaderOpen(file.id);
                }}>
                    Show File Header
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => traceStore.closeFile(file.id)}>
                    Close
                </ContextMenuItem>
                <ContextMenuItem onClick={() => traceStore.closeOtherFiles(file.id)}>
                    Close Others
                </ContextMenuItem>
                <ContextMenuItem onClick={() => traceStore.closeAllFiles()}>
                    Close All
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}

function getRowClasses(isSelected: boolean, hasError: boolean) {
    return cn(
        "relative flex items-center gap-2 px-3 py-0.5 text-xs cursor-pointer transition-colors border-l-2 select-none group",
        isSelected
            ? "bg-muted-foreground/20 border-primary outline -outline-offset-1 outline-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 border-transparent",
        hasError
            ? "text-red-600 dark:text-red-400"
            : ""
    );
}

const errorCountBadgeClasses = "\
absolute -top-1 -right-1 \
px-1 py-px \
text-[0.5rem] \
font-mono \
text-red-700 \
bg-red-100 \
dark:text-black \
dark:bg-red-400 \
border-red-500/50 \
dark:border-red-600 \
border-[1.5px] \
rounded-full";
