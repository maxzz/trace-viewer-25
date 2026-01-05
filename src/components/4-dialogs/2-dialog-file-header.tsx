import { useAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/shadcn/dialog";
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { dialogFileHeaderOpenAtom } from "@/store/2-ui-atoms";
import { traceStore } from "@/store/traces-store/0-state";

export function DialogFileHeader() {
    const [open, onOpenChange] = useAtom(dialogFileHeaderOpenAtom);
    const { header, fileName } = useSnapshot(traceStore);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]" aria-describedby={undefined}>

                <DialogHeader>
                    <DialogTitle>Trace File Header</DialogTitle>
                </DialogHeader>

                <div className="py-4 grid gap-4">
                    <div className="grid gap-2">
                        <Input className="bg-muted" value={fileName || ''} readOnly tabIndex={-1} />
                    </div>

                    <div className="grid gap-2">
                        <Textarea className="min-h-[300px] text-sm font-mono bg-muted resize-none" value={header.rawText || ''} readOnly />
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}
