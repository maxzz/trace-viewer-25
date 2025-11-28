import React, { useCallback } from "react";
import { useSnapshot } from "valtio";
import { traceStore } from "../../store/trace-store";
import { Input } from "../ui/shadcn/input";
import { MenubarItem, MenubarShortcut } from "../ui/shadcn/menubar";

export function TraceLoadInput({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null> }) {
    const { isLoading } = useSnapshot(traceStore);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            traceStore.loadTrace(file);
        }
        // Reset input so same file can be selected again if needed
        e.target.value = '';
    }, []);

    return (
        <Input
            type="file"
            accept=".trc3"
            onChange={handleFileChange}
            className="hidden"
            ref={inputRef}
            disabled={isLoading}
        />
    );
}

export function TraceOpenMenuItem({ onClick }: { onClick: () => void }) {
    const { isLoading } = useSnapshot(traceStore);

    return (
        <MenubarItem onClick={onClick} disabled={isLoading}>
            Open Trace File...
            <MenubarShortcut>Ctrl+O</MenubarShortcut>
        </MenubarItem>
    );
}
