import { useCallback, useRef } from "react";
import { useSetAtom, useAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { extractTracesFromZip, isZipFile, cancelTimelineBuild } from "@/workers-client";
import { traceStore } from "@/store/traces-store/0-state";
import { Input } from "../ui/shadcn/input";
import { Button } from "../ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/shadcn/dialog";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from "../ui/shadcn/menubar";
import { dialogFileHeaderOpenAtom, dialogAboutOpenAtom, dialogOptionsOpenAtom, dialogEditFiltersOpenAtom, dialogEditHighlightsOpenAtom, dialogTimelineCancelOpenAtom } from "@/store/2-ui-atoms";
import { setAppTitle } from '@/store/3-ui-app-title';

export function TopMenu() {
    const setOptionsOpen = useSetAtom(dialogOptionsOpenAtom);
    const setAboutOpen = useSetAtom(dialogAboutOpenAtom);
    const setFileHeaderOpen = useSetAtom(dialogFileHeaderOpenAtom);
    const setEditFiltersOpen = useSetAtom(dialogEditFiltersOpenAtom);
    const setEditHighlightsOpen = useSetAtom(dialogEditHighlightsOpenAtom);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { files, selectedFileId } = useSnapshot(traceStore);
    const hasFile = files.length > 0;
    const hasActiveFile = !!selectedFileId;

    return (<>
        <TraceLoadInput inputRef={fileInputRef} />

        <div className="border-b flex items-center justify-between bg-background">
            <Menubar className="px-2 border-none shadow-none rounded-none bg-transparent">

                <MenubarMenu>
                    <MenubarTrigger>
                        File
                    </MenubarTrigger>
                    <MenubarContent>
                        <TraceOpenMenuItem onClick={() => fileInputRef.current?.click()} />
                        <MenubarItem onClick={() => setOptionsOpen(true)}>
                            Options...
                        </MenubarItem>

                        {/* Exit Menu Item - not implemented yet */}
                        {/* <MenubarSeparator />
                        <MenubarItem disabled>
                            Exit <MenubarShortcut>Ctrl+Q</MenubarShortcut>
                        </MenubarItem> */}
                    </MenubarContent>
                </MenubarMenu>

                <MenubarMenu>
                    <MenubarTrigger>
                        View
                    </MenubarTrigger>
                    <MenubarContent>
                        <MenubarItem onClick={() => setEditFiltersOpen(true)}>
                            File Filters...
                        </MenubarItem>
                        <MenubarItem onClick={() => setEditHighlightsOpen(true)}>
                            Highlight Rules...
                        </MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem onClick={() => setFileHeaderOpen(selectedFileId)} disabled={!hasActiveFile}>
                            Show File Header ...
                        </MenubarItem>
                    </MenubarContent>
                </MenubarMenu>

                <MenubarMenu>
                    <MenubarTrigger>
                        Help
                    </MenubarTrigger>
                    <MenubarContent>
                        <MenubarItem onClick={() => setAboutOpen(true)}>
                            About ViewTrace...
                        </MenubarItem>
                    </MenubarContent>
                </MenubarMenu>

            </Menubar>
            <TimelineProgress />
        </div>
    </>);
}

function TimelineProgress() {
    const { isTimelineLoading } = useSnapshot(traceStore);
    const [open, setOpen] = useAtom(dialogTimelineCancelOpenAtom);

    if (!isTimelineLoading) return null;

    return (
        <>
            <Button 
                variant="ghost" 
                size="sm" 
                className="mr-2 h-8 px-2 text-xs"
                onClick={() => setOpen(true)}
                title="Building timeline... Click to cancel."
            >
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
                Building Timeline...
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Timeline Build?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to stop the timeline generation? The current progress will be lost.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setOpen(false)}>Continue</Button>
                        <Button variant="destructive" onClick={() => {
                            cancelTimelineBuild();
                            traceStore.setTimelineLoading(false);
                            traceStore.setTimeline([]);
                            toast.info("Timeline build cancelled");
                            setOpen(false);
                        }}>
                            Stop Build
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// Legacy files input

function TraceLoadInput({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null>; }) {
    // const { isLoading } = useSnapshot(traceStore);

    const handleFileChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                // Clear previously uploaded files
                traceStore.closeAllFiles();

                const fileList = Array.from(files);

                // Update title
                setAppTitle(fileList);

                // Load new files
                for (const file of fileList) {
                    if (isZipFile(file)) {
                        await extractTracesFromZip(file);
                    } else {
                        traceStore.loadTrace(file);
                    }
                }
            }
            // Reset input so same file can be selected again if needed
            e.target.value = '';
        }, []
    );

    return (
        <Input
            type="file"
            accept=".trc3,.zip"
            multiple
            onChange={handleFileChange}
            className="hidden"
            ref={inputRef}
        />
    );
}

function TraceOpenMenuItem({ onClick }: { onClick: () => void; }) {
    // const { isLoading } = useSnapshot(traceStore);
    return (
        <MenubarItem onClick={onClick}>
            Open Trace File...
            <MenubarShortcut>Ctrl+O</MenubarShortcut>
        </MenubarItem>
    );
}
