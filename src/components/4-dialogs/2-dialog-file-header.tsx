import React from "react";
import { useAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/shadcn/dialog";
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { ScrollArea } from "@/components/ui/shadcn/scroll-area";
import { dialogFileHeaderOpenAtom } from "@/store/2-ui-atoms";
import { traceStore } from "@/store/traces-store/0-state";

export function DialogFileHeader() {
    const [open, onOpenChange] = useAtom(dialogFileHeaderOpenAtom);
    const { header, fileName } = useSnapshot(traceStore);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>

                <DialogHeader>
                    <DialogTitle>
                        Trace File Header
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4 grid gap-4">
                    <div className="grid gap-2">
                        <Input className="bg-muted" value={fileName || ''} readOnly tabIndex={-1} />
                    </div>

                    <ScrollArea className="min-h-[300px] bg-muted rounded border border-input px-3 py-2">
                        <div className="space-y-0">
                            {formatHeaderText(header.rawText || '')}
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}

function formatHeaderText(text: string): React.ReactElement[] {
    if (!text) return [];
    
    const lines = text.split('\n');
    return lines.map((line, index) => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0 && colonIndex < line.length - 1) {
            const prefix = line.substring(0, colonIndex + 1);
            const rest = line.substring(colonIndex + 1);
            return (
                <div key={index} className="text-xs font-mono">
                    <span className="font-bold">{prefix}</span>
                    <span>{rest}</span>
                </div>
            );
        }
        return (
            <div key={index} className="text-xs font-mono">
                {line}
            </div>
        );
    });
}
