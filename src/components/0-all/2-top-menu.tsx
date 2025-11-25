import React, { useRef } from 'react';
import { TraceLoadInput, TraceOpenMenuItem } from '../trace-viewer/1-trace-uploader';
import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarShortcut,
    MenubarTrigger,
} from "../ui/shadcn/menubar";

export function TopMenu() {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <>
            <TraceLoadInput inputRef={fileInputRef} />
            
            {/* Top Menu */}
            <div className="border-b">
                <Menubar className="border-none shadow-none rounded-none px-2">
                    <MenubarMenu>
                        <MenubarTrigger>File</MenubarTrigger>
                        <MenubarContent>
                            <TraceOpenMenuItem onClick={() => fileInputRef.current?.click()} />
                            <MenubarSeparator />
                            <MenubarItem disabled>
                                Exit <MenubarShortcut>Ctrl+Q</MenubarShortcut>
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                        <MenubarTrigger>View</MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem disabled>Filter...</MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                        <MenubarTrigger>Help</MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem disabled>About</MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                </Menubar>
            </div>
        </>
    );
}

