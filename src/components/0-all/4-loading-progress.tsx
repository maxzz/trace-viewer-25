import { useAtom, useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { notice } from "@/components/ui/local-ui/7-toaster";
import { cancelAllTimesBuild } from "@/workers-client";
import { allTimesStore } from "@/store/traces-store/3-all-times-store";
import { isLoadingFilesAtom } from "@/store/traces-store/1-1-load-files";
import { dialogTimelineCancelOpenAtom } from "@/store/2-ui-atoms";

export function TimelineProgress() {
    const [open, setOpen] = useAtom(dialogTimelineCancelOpenAtom);
    const isLoadingFiles = useAtomValue(isLoadingFilesAtom);
    const { allTimesIsLoading } = useSnapshot(allTimesStore);
    
    if (isLoadingFiles) {
        return (
            <Button className="mr-2 h-8 px-2 text-xs" variant="ghost" size="sm" disabled>
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
                Parsing files...
            </Button>
        );
    }

    if (!allTimesIsLoading) {
        return null;
    }

    return (<>
        <Button className="mr-2 h-8 px-2 text-xs" variant="ghost" size="sm" onClick={() => setOpen(true)} title="Building timeline... Click to cancel.">
            <Loader2 className="h-3 w-3 animate-spin mr-2" />
            Building timeline...
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Cancel Timeline Build?
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to stop the timeline generation? The current progress will be lost.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button variant="secondary" onClick={() => setOpen(false)}>Continue</Button>
                    <Button variant="destructive"
                        onClick={
                            () => {
                                cancelAllTimesBuild();
                                allTimesStore.setAllTimesLoading(false);
                                allTimesStore.setAllTimes([]);
                                notice.info("Timeline build cancelled");
                                setOpen(false);
                            }
                        }
                    >
                        Stop Build
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>);
}
