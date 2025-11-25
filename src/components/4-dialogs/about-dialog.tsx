import React from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/shadcn/dialog";
import { Button } from "../ui/shadcn/button";

interface AboutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
    // Using hardcoded values matching the C++ resource request
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>About ViewTrace</DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    <div className="flex items-start gap-4">
                        {/* Icon placeholder - using a simple div or generic icon if actual icon not available */}
                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            V
                        </div>
                        
                        <div className="space-y-1 text-sm">
                            <p className="font-semibold">Trace Viewer</p>
                            <p>Digital Persona, Inc.</p>
                            <p className="text-muted-foreground">All Rights Reserved. Copyright (c) 2003-2022</p>
                            <p className="mt-2">Version: 0.0.1</p> 
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>OK</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

