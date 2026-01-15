import { useCallback, useRef } from "react";
import { useSetAtom, useAtom } from "jotai";
import { useSnapshot } from "valtio";
import { notice } from "../ui/local-ui/7-toaster";
import { cancelAllTimesBuild } from "@/workers-client";
import { filesListStore } from "@/store/traces-store/0-files-current-state";
import { closeAllFiles } from "@/store/traces-store/0-files-actions";
import { allTimesStore } from "@/store/traces-store/3-all-times-store";
import { asyncLoadAnyFiles } from "@/store/traces-store/1-1-load-files";
import { Input } from "../ui/shadcn/input";
import { Button } from "../ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/shadcn/dialog";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from "../ui/shadcn/menubar";
import { Loader2 } from "lucide-react";
import { dialogFileHeaderOpenAtom, dialogAboutOpenAtom, dialogOptionsOpenAtom, dialogEditFiltersOpenAtom, dialogEditHighlightsOpenAtom, dialogTimelineCancelOpenAtom } from "@/store/2-ui-atoms";

export function TopMenu() {
    const setOptionsOpen = useSetAtom(dialogOptionsOpenAtom);
    const setAboutOpen = useSetAtom(dialogAboutOpenAtom);
    const setEditFiltersOpen = useSetAtom(dialogEditFiltersOpenAtom);
    const setEditHighlightsOpen = useSetAtom(dialogEditHighlightsOpenAtom);

    const fileInputRef = useRef<HTMLInputElement>(null);

    return (<>
        <InputWatchFilesLoad inputRef={fileInputRef} />

        <div className="border-b flex items-center justify-between bg-background">
            <Menubar className="px-2 border-none shadow-none rounded-none bg-transparent">

                <MenubarMenu>
                    <MenubarTrigger>
                        File
                    </MenubarTrigger>
                    <MenubarContent>
                        <MenuItemOpenFile onClick={() => fileInputRef.current?.click()} />
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
                        <MenuItemShowFileHeader />
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

// Legacy files input

function InputWatchFilesLoad({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null>; }) {
    // const { isLoading } = useSnapshot(traceStore);

    const handleFileChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                closeAllFiles(); // Clear previously uploaded files

                const fileList = Array.from(files);
                asyncLoadAnyFiles(fileList);
            }
            e.target.value = ''; // Reset input so same file can be selected again if needed
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

function MenuItemOpenFile({ onClick }: { onClick: () => void; }) {
    // const { isLoading } = useSnapshot(traceStore);
    return (
        <MenubarItem onClick={onClick}>
            Open Trace File...
            <MenubarShortcut>Ctrl+O</MenubarShortcut>
        </MenubarItem>
    );
}

function MenuItemShowFileHeader() {
    const setFileHeaderOpen = useSetAtom(dialogFileHeaderOpenAtom);
    const { currentFileState } = useSnapshot(filesListStore);
    const selectedFileId = currentFileState?.id ?? null;

    return (
        <MenubarItem onClick={() => setFileHeaderOpen(selectedFileId)} disabled={!selectedFileId}>
            Show File Header ...
        </MenubarItem>
    );
}

function TimelineProgress() {
    const [open, setOpen] = useAtom(dialogTimelineCancelOpenAtom);

    const { allTimesIsLoading } = useSnapshot(allTimesStore);
    if (!allTimesIsLoading) {
        return null;
    }

    return (<>
        <Button className="mr-2 h-8 px-2 text-xs" variant="ghost" size="sm" onClick={() => setOpen(true)} title="Building timeline... Click to cancel.">
            <Loader2 className="h-3 w-3 animate-spin mr-2" />
            Building Timeline...
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
