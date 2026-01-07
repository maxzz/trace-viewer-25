import { useCallback, useRef } from "react";
import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { traceStore } from "../../store/traces-store/0-state";
import { Input } from "../ui/shadcn/input";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from "../ui/shadcn/menubar";
import { dialogFileHeaderOpenAtom, dialogAboutOpenAtom, dialogOptionsOpenAtom, dialogEditFiltersOpenAtom, dialogEditHighlightsOpenAtom } from "../../store/2-ui-atoms";
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

        <div className="border-b">
            <Menubar className="px-2 border-none shadow-none rounded-none">

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
                            File Name Filters...
                        </MenubarItem>
                        <MenubarItem onClick={() => setEditHighlightsOpen(true)}>
                            File Name Highlight Rules...
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
        </div>
    </>);
}

// Legacy files input

function TraceLoadInput({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null>; }) {
    // const { isLoading } = useSnapshot(traceStore);

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                // Clear previously uploaded files
                traceStore.closeAllFiles();

                const fileList = Array.from(files);

                // Update title
                setAppTitle(fileList);

                // Load new files
                fileList.forEach(file => {
                    traceStore.loadTrace(file);
                });
            }
            // Reset input so same file can be selected again if needed
            e.target.value = '';
        }, []
    );

    return (
        <Input
            type="file"
            accept=".trc3"
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
