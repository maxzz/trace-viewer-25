import { useCallback } from "react";
import { appSettings } from "../../store/ui-settings";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../ui/shadcn/resizable";
import { FileList } from "../1-file-list/2-file-list";
import { TraceList } from "../2-trace-viewer";

export function TraceMainView() {
    const savedSizes = appSettings.panelSizes;
    const defaultFilePanelSize = savedSizes?.[0] ?? 20;
    const defaultTracePanelSize = savedSizes?.[1] ?? 80;

    const handleLayout = useCallback(
        (sizes: number[]) => {
            appSettings.panelSizes = sizes;
        }, []
    );

    return (
        <ResizablePanelGroup className="h-full border-t" direction="horizontal" onLayout={handleLayout}
        >
            <ResizablePanel
                defaultSize={defaultFilePanelSize}
                minSize={15}
                maxSize={40}
                className="min-w-[200px]"
            >
                <FileList />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={defaultTracePanelSize}>
                <div className="h-full overflow-hidden flex flex-col">
                    <TraceList />
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
