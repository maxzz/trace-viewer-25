import { useRef } from "react";
import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { TraceLoadInput, TraceOpenMenuItem } from "./2-top-menu-input-file";
import { traceStore } from "../../store/traces-store/0-state";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarTrigger } from "../ui/shadcn/menubar";
import { dialogFileHeaderOpenAtom, dialogAboutOpenAtom, dialogOptionsOpenAtom, dialogEditFiltersOpenAtom } from "../../store/ui-atoms";

export function TopMenu() {
    const setOptionsOpen = useSetAtom(dialogOptionsOpenAtom);
    const setAboutOpen = useSetAtom(dialogAboutOpenAtom);
    const setFileHeaderOpen = useSetAtom(dialogFileHeaderOpenAtom);
    const setEditFiltersOpen = useSetAtom(dialogEditFiltersOpenAtom);

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
                            Filter...
                        </MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem onClick={() => setFileHeaderOpen(true)} disabled={!hasActiveFile}>
                            Display File Header ...
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
