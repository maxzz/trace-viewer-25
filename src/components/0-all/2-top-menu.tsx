import { useRef } from "react";
import { TraceLoadInput, TraceOpenMenuItem } from "../1-trace-viewer/1-trace-uploader";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarTrigger } from "../ui/shadcn/menubar";
import { useSnapshot } from "valtio";
import { traceStore } from "../../store/trace-store";
import { useSetAtom } from "jotai";
import { dialogFileHeaderOpenAtom, dialogAboutOpenAtom, dialogOptionsOpenAtom } from "../../store/ui-atoms";

export function TopMenu() {
    const setOptionsOpen = useSetAtom(dialogOptionsOpenAtom);
    const setAboutOpen = useSetAtom(dialogAboutOpenAtom);
    const setFileHeaderOpen = useSetAtom(dialogFileHeaderOpenAtom);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { lines } = useSnapshot(traceStore);
    const hasFile = lines.length > 0;

    return (<>
        <TraceLoadInput inputRef={fileInputRef} />

        {/* Top Menu */}
        <div className="border-b">
            <Menubar className="border-none shadow-none rounded-none px-2">

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
                        <MenubarItem disabled>
                            Filter...
                        </MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem onClick={() => setFileHeaderOpen(true)} disabled={!hasFile}>
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
