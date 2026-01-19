import { useCallback, useEffect, useRef } from "react";
import { useSetAtom, useAtomValue } from "jotai";
import { Input } from "../ui/shadcn/input";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from "../ui/shadcn/menubar";
import { currentFileStateAtom } from "@/store/traces-store/0-files-current-state";
import { closeAllFiles, closeFile, closeOtherFiles } from "@/store/traces-store/0-files-actions";
import { asyncLoadAnyFiles } from "@/store/traces-store/1-1-load-files";
import { filesCountAtom } from "@/store/6-filtered-files";
import { dialogFileHeaderOpenAtom, dialogAboutOpenAtom, dialogOptionsOpenAtom, dialogEditFiltersOpenAtom, dialogEditHighlightsOpenAtom } from "@/store/2-ui-atoms";

export function TopMenu() {
    const setOptionsOpen = useSetAtom(dialogOptionsOpenAtom);
    const setAboutOpen = useSetAtom(dialogAboutOpenAtom);
    const setEditFiltersOpen = useSetAtom(dialogEditFiltersOpenAtom);
    const setEditHighlightsOpen = useSetAtom(dialogEditHighlightsOpenAtom);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    // Global keyboard shortcuts
    useEffect(
        () => {
            const handleKeyDown = (e: KeyboardEvent) => {
                if ((e.ctrlKey || e.metaKey) && e.key === ',') {
                    e.preventDefault();
                    setOptionsOpen(true);
                }
                if (e.altKey && (e.key === 'r' || e.key === 'R')) {
                    e.preventDefault();
                    setEditHighlightsOpen(true);
                }
            };

            const controller = new AbortController();
            window.addEventListener('keydown', handleKeyDown, { signal: controller.signal });
            return () => controller.abort();
        }, [setOptionsOpen, setEditHighlightsOpen]
    );

    return (<>
        <InputWatchFilesLoad inputRef={fileInputRef} />
        <InputWatchFolderLoad inputRef={folderInputRef} />

        <Menubar className="px-2 border-none shadow-none rounded-none bg-transparent">

            <MenubarMenu>
                <MenubarTrigger>
                    File
                </MenubarTrigger>
                <MenubarContent>
                    <MenuItemOpenFile onClick={() => fileInputRef.current?.click()} />
                    <MenuItemOpenFolder onClick={() => folderInputRef.current?.click()} />
                    <MenubarSeparator />
                    <MenuItemCloseOptions />

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
                        <MenubarShortcut>Alt+R</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem onClick={() => setOptionsOpen(true)}>
                        Options...
                        <MenubarShortcut>Ctrl+,</MenubarShortcut>
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
                        About
                    </MenubarItem>
                </MenubarContent>
            </MenubarMenu>

        </Menubar>
    </>);
}

function MenuItemOpenFile({ onClick }: { onClick: () => void; }) {
    // const { isLoading } = useSnapshot(traceStore);
    return (
        <MenubarItem onClick={onClick}>
            Open File...
            <MenubarShortcut>Ctrl+O</MenubarShortcut>
        </MenubarItem>
    );
}

function MenuItemOpenFolder({ onClick }: { onClick: () => void; }) {
    return (
        <MenubarItem onClick={onClick}>
            Open Folder...
            <MenubarShortcut>Ctrl+K Ctrl+O</MenubarShortcut>
        </MenubarItem>
    );
}

function MenuItemCloseOptions() {
    const selectedFileId = useAtomValue(currentFileStateAtom)?.id;
    const filesCount = useAtomValue(filesCountAtom);

    return (<>
        <MenubarItem disabled={!selectedFileId} onClick={() => selectedFileId && closeFile(selectedFileId)}>
            Close
        </MenubarItem>
        <MenubarItem disabled={!selectedFileId || filesCount === 1} onClick={() => selectedFileId && closeOtherFiles(selectedFileId)}>
            Close Others
        </MenubarItem>
        <MenubarItem disabled={filesCount === 0} onClick={() => closeAllFiles()}>
            Close All
        </MenubarItem>
    </>);
}

function MenuItemShowFileHeader() {
    const setFileHeaderOpen = useSetAtom(dialogFileHeaderOpenAtom);
    const currentFileState = useAtomValue(currentFileStateAtom);
    const selectedFileId = currentFileState?.id ?? null;

    return (
        <MenubarItem onClick={() => setFileHeaderOpen(selectedFileId)} disabled={!selectedFileId}>
            Show File Header ...
        </MenubarItem>
    );
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

function InputWatchFolderLoad({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null>; }) {
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
            // @ts-ignore
            webkitdirectory=""
            // @ts-ignore
            directory=""
            multiple
            onChange={handleFileChange}
            className="hidden"
            ref={inputRef}
        />
    );
}
