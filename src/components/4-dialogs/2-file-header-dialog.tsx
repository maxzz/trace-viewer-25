import React from "react";
import { useSnapshot } from "valtio";
import { traceStore } from "../../store/trace-store";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/shadcn/dialog";
import { Button } from "../ui/shadcn/button";
import { Input } from "../ui/shadcn/input";
import { Textarea } from "../ui/shadcn/textarea";

interface FileHeaderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function FileHeaderDialog({ open, onOpenChange }: FileHeaderDialogProps) {
    const { header, fileName } = useSnapshot(traceStore);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Trace File Header</DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Input
                            value={fileName || ''}
                            readOnly
                            className="bg-muted"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Textarea
                            value={header.rawText || ''}
                            readOnly
                            className="font-mono text-sm min-h-[300px] bg-muted resize-none"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

