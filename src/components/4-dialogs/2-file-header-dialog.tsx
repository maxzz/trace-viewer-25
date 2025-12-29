import { useSnapshot } from "valtio";
import { useAtom } from "jotai";
import { traceStore } from "@/store/trace-store";
import { fileHeaderOpenAtom } from "@/store/ui-atoms";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, } from "../ui/shadcn/dialog";
import { Button } from "../ui/shadcn/button";
import { Input } from "../ui/shadcn/input";
import { Textarea } from "../ui/shadcn/textarea";

export function FileHeaderDialog() {
    const [open, onOpenChange] = useAtom(fileHeaderOpenAtom);

    const { header, fileName } = useSnapshot(traceStore);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">

                <DialogHeader>
                    <DialogTitle>Trace File Header</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Input className="bg-muted" value={fileName || ''} readOnly />
                    </div>

                    <div className="grid gap-2">
                        <Textarea className="font-mono text-sm min-h-[300px] bg-muted resize-none" value={header.rawText || ''} readOnly />
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}
