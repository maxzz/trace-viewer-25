import { useRef, useState } from "react";
import { TraceLoadInput, TraceOpenMenuItem } from "../1-trace-viewer/1-trace-uploader";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from "../ui/shadcn/menubar";
import { FileHeaderDialog } from "../4-dialogs/file-header-dialog";
import { AboutDialog } from "../4-dialogs/about-dialog";
import { OptionsDialog } from "../4-dialogs/options-dialog";
import { useSnapshot } from "valtio";
import { traceStore } from "../../store/trace-store";

export function TopMenu() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileHeaderOpen, setFileHeaderOpen] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);
    const [optionsOpen, setOptionsOpen] = useState(false);
    const { lines } = useSnapshot(traceStore);
    const hasFile = lines.length > 0;

    return (<>
        <TraceLoadInput inputRef={fileInputRef} />

        <FileHeaderDialog open={fileHeaderOpen} onOpenChange={setFileHeaderOpen} />
        <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
        <OptionsDialog open={optionsOpen} onOpenChange={setOptionsOpen} />

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
