import React from "react";
import { TraceList } from "../1-trace-viewer/2-trace-list";
import { FileList } from "../1-trace-viewer/3-file-list/2-file-list";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../ui/shadcn/resizable";

export function TraceMainView() {
    return (
        <ResizablePanelGroup direction="horizontal" className="h-full border-t">
            <ResizablePanel defaultSize={20} minSize={15} maxSize={40} className="min-w-[200px]">
                <FileList />
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={80}>
                <div className="h-full overflow-hidden flex flex-col">
                    <TraceList />
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
