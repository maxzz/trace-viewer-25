import { memo } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useSnapshot, type Snapshot } from "valtio";
import { cn } from "@/utils/index";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger, } from "../ui/shadcn/context-menu";
import { appSettings } from "@/store/1-ui-settings";
import { AlertCircle, FileText } from "lucide-react";
import { SymbolSpinner } from "../ui/icons/symbols";
import { type FileState } from "@/store/traces-store/9-types-files-store";
import { selectFile, closeFile, closeOtherFiles, closeAllFiles } from "@/store/traces-store/0-files-actions";
import { allTimesStore } from "@/store/traces-store/3-all-times-store";
import { dialogFileHeaderOpenAtom } from "@/store/2-ui-atoms";
import { getFileLoadingAtom } from "@/store/traces-store/1-3-file-loading-atoms";

export const FileListRow = memo(function FileListRow({ fileState, isSelected }: { fileState: Snapshot<FileState>; isSelected: boolean; }) {
    const isLoading = useAtomValue(getFileLoadingAtom(fileState.id));
    const hasError = fileState.data.errorsInTraceCount > 0 || !!fileState.data.errorLoadingFile;
    const { highlightRules, highlightEnabled } = useSnapshot(appSettings);
    const { allTimes, allTimesSelectedTimestamp } = useSnapshot(allTimesStore);
    const setFileHeaderOpen = useSetAtom(dialogFileHeaderOpenAtom);

    const highlightColor = getHighlightColor(highlightEnabled, highlightRules, fileState.matchedHighlightIds);

    const isMarked = allTimesSelectedTimestamp
        ? allTimes.find((t) => t.timestamp === allTimesSelectedTimestamp)?.fileIds.includes(fileState.id)
        : false;

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div className={getRowClasses(isSelected, hasError)} onClick={() => selectFile(fileState.id)}>
                    {/* Highlight Background Layer */}
                    {!isSelected && highlightColor && (
                        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundColor: `var(--color-${highlightColor})` }} />
                    )}

                    {/* File icon */}
                    <div className="relative shrink-0 z-10">
                        <FileText className={cn("size-4", isSelected ? "text-primary" : "opacity-70", hasError && "text-red-600 dark:text-red-400")} />

                        {fileState.data.errorsInTraceCount === 0 && !!fileState.data.errorLoadingFile && (
                            <div className="absolute -top-1 -right-1 bg-background rounded-full">
                                <AlertCircle className="size-3 text-red-500 fill-background" />
                            </div>
                        )}

                        {/* Error count badge */}
                        {fileState.data.errorsInTraceCount > 0 && (
                            <span className={errorCountBadgeClasses}>
                                {fileState.data.errorsInTraceCount}
                            </span>
                        )}
                    </div>

                    {/* File name */}
                    <span className="flex-1 truncate z-10" title={fileState.data.fileName}>
                        {fileState.data.fileName}
                    </span>

                    {/* Loading indicator */}
                    {isLoading && (
                        <SymbolSpinner className="size-2 text-blue-500/40 stroke-2 animate-spin shrink-0 z-10" />
                    )}

                    {/* Timeline Marker */}
                    {isMarked && (
                        <div
                            className="ml-auto shrink-0 z-10 hover:scale-125 transition-transform"
                            onClick={(e) => {
                                e.stopPropagation();
                                selectFile(fileState.id);
                                allTimesStore.setPendingScrollTimestamp(allTimesSelectedTimestamp, fileState.id);
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
                    setFileHeaderOpen(fileState.id);
                }}>
                    Show File Header
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => closeFile(fileState.id)}>
                    Close
                </ContextMenuItem>
                <ContextMenuItem onClick={() => closeOtherFiles(fileState.id)}>
                    Close Others
                </ContextMenuItem>
                <ContextMenuItem onClick={() => closeAllFiles()}>
                    Close All
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
});

function getHighlightColor(highlightEnabled: boolean, highlightRules: readonly { id: string; color?: string; }[], matchedHighlightIds: readonly string[] | undefined): string | undefined {
    if (!highlightEnabled || !matchedHighlightIds || matchedHighlightIds.length === 0) {
        return undefined;
    }

    // Find the first rule in appSettings that matches one of the file's matched IDs.
    // We iterate through highlightRules to preserve order priority
    const rule = highlightRules.find(r => matchedHighlightIds.includes(r.id));
    return rule?.color;
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
