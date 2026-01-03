import React from "react";
import { type TraceFile, traceStore } from "../../../store/traces-store/0-state";
import { cn } from "@/utils/index";
import { AlertCircle, FileText } from "lucide-react";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "../../ui/shadcn/context-menu";

interface FileListItemProps {
    file: TraceFile;
    isSelected: boolean;
    onClick: () => void;
}

export function FileListItem({ file, isSelected, onClick }: FileListItemProps) {
    const hasError = file.errorCount > 0 || !!file.error;

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <div
                    className={cn(
                        "flex items-center gap-2 px-3 py-0.5 text-xs cursor-pointer transition-colors border-l-2 select-none group",
                        isSelected 
                            ? "bg-background border-primary text-foreground font-medium shadow-sm" 
                            : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                        hasError && !isSelected ? "text-red-600 dark:text-red-400" : ""
                    )}
                    onClick={onClick}
                >
                    <div className="relative shrink-0">
                        <FileText className={cn("size-4", isSelected ? "text-primary" : "opacity-70")} />
                        {hasError && (
                            <div className="absolute -top-1 -right-1 bg-background rounded-full">
                                <AlertCircle className="size-3 text-red-500 fill-background" />
                            </div>
                        )}
                    </div>
                    
                    <span className="truncate flex-1 leading-none" title={file.fileName}>
                        {file.fileName}
                    </span>

                    {file.errorCount > 0 && (
                        <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-1.5 py-0.5 rounded-full font-mono shrink-0">
                            {file.errorCount}
                        </span>
                    )}
                    
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
