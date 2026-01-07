import { type TraceFile, traceStore } from "../../store/traces-store/0-state";
import { cn } from "@/utils/index";
import { AlertCircle, FileText } from "lucide-react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger, } from "../ui/shadcn/context-menu";
import { useSnapshot } from "valtio";
import { appSettings } from "@/store/1-ui-settings";

interface FileListItemProps {
    file: TraceFile;
    isSelected: boolean;
    onClick: () => void;
}

export function FileListRow({ file, isSelected, onClick }: FileListItemProps) {
    const hasError = file.errorCount > 0 || !!file.error;
    const { highlightRules, highlightEnabled } = useSnapshot(appSettings);

    let highlightColor = undefined;
    if (highlightEnabled && file.matchedHighlightIds && file.matchedHighlightIds.length > 0) {
        // Find the first rule in appSettings that matches one of the file's matched IDs
        // We iterate through highlightRules to preserve order priority
        const rule = highlightRules.find(r => file.matchedHighlightIds.includes(r.id));
        if (rule && rule.color) {
            highlightColor = rule.color;
        }
    }

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <div
                    className={cn(
                        "flex items-center gap-2 px-3 py-0.5 text-xs cursor-pointer transition-colors border-l-2 select-none group",
                        isSelected
                            ? "bg-muted-foreground/20 border-primary outline -outline-offset-1 outline-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 border-transparent",
                        hasError
                            ? !isSelected
                                ? "text-red-600 dark:text-red-400"
                                : "text-red-600 dark:text-red-400"
                            : "",
                         // Use style for background opacity to avoid purging issues with dynamic classes
                        !isSelected && highlightColor ? `bg-opacity-20` : ""
                    )}
                    style={
                        (!isSelected && highlightColor) 
                            ? { backgroundColor: `var(--color-${highlightColor})` } as React.CSSProperties
                            : undefined
                    }
                    onClick={onClick}
                >
                    {/* File icon */}
                    <div className="relative shrink-0">
                        <FileText className={cn("size-4", isSelected ? "text-primary" : "opacity-70", hasError && "text-red-600 dark:text-red-400")} />

                        {file.errorCount === 0 && !!file.error && (
                            <div className="absolute -top-1 -right-1 bg-background rounded-full">
                                <AlertCircle className="size-3 text-red-500 fill-background" />
                            </div>
                        )}

                        {file.errorCount > 0 && (
                            <span className={cn("\
                            absolute -top-1 -right-1 \
                            px-1 py-px \
                            text-[0.5rem] \
                            font-mono \
                            text-red-700 \
                            bg-red-100 \
                            dark:text-red-300 \
                            dark:bg-red-900/30 \
                            border-[1.5px] border-red-500/50 \
                            rounded-full \
                            ")}>
                                {file.errorCount}
                            </span>
                        )}

                    </div>

                    <span className="flex-1 truncate" title={file.fileName}>
                        {file.fileName}
                    </span>

                    {/* Error count badge */}
                    {/* {file.errorCount > 0 && (
                        <span className={cn("\
                            shrink-0 \
                            px-1 \
                            py-px \
                            text-[0.5rem] \
                            font-mono \
                            text-red-700 \
                            bg-red-100 \
                            dark:text-red-300 \
                            dark:bg-red-900/30 \
                            border border-red-500/30 \
                            rounded-full \
                            ")}>
                            {file.errorCount}
                        </span>
                    )} */}

                    {/* Loading indicator */}
                    {file.isLoading && (
                        <span className="size-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                    )}
                </div>
            </ContextMenuTrigger>

            <ContextMenuContent>
                <ContextMenuItem onClick={() => traceStore.closeFile(file.id)} className="text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900/20">
                    Close
                </ContextMenuItem>
                <ContextMenuItem onClick={() => traceStore.closeOtherFiles(file.id)}>
                    Close Others
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => traceStore.closeAllFiles()}>
                    Close All
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
