import React, { useCallback } from "react";
import { useSnapshot } from "valtio";
import { traceStore } from "../../store/traces-store/0-state";
import { Input } from "../ui/shadcn/input";
import { MenubarItem, MenubarShortcut } from "../ui/shadcn/menubar";

export function TraceLoadInput({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null> }) {
    const { isLoading } = useSnapshot(traceStore);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            // Clear previously uploaded files
            traceStore.closeAllFiles();
            // Load new files
            Array.from(files).forEach(file => {
                traceStore.loadTrace(file);
            });
        }
        // Reset input so same file can be selected again if needed
        e.target.value = '';
    }, []);

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

export function TraceOpenMenuItem({ onClick }: { onClick: () => void }) {
    const { isLoading } = useSnapshot(traceStore);

    return (
        <MenubarItem onClick={onClick}>
            Open Trace File...
            <MenubarShortcut>Ctrl+O</MenubarShortcut>
        </MenubarItem>
    );
}
