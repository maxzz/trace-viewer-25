import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/shadcn/dialog";
import { Button } from "../ui/shadcn/button";
import { IconAppLogo, IconBinocular } from "../ui/icons";

interface AboutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
    // Using hardcoded values matching the C++ resource request
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="px-4 py-3 w-auto sm:max-w-[400px] text-xs">
                <DialogHeader>
                    <DialogTitle className="text-sm">About</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-[auto_1fr] gap-2">

                    <div className="px-1 bg-sky-500/5 rounded flex items-center justify-center">
                        <IconBinocular className="p-1 size-12 border-sky-500 border rounded shadow" />
                        {/* <IconAppLogo className="p-2" /> */}
                    </div>

                    <div className="space-y-1 text-xs">
                        <p className="font-semibold">Trace Viewer</p>
                        <p>Digital Persona, Inc.</p>
                        <p className="text-muted-foreground">All Rights Reserved. Copyright (c) 2003-2022</p>
                        <p className="mt-2">Version: 0.2.1</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>OK</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

