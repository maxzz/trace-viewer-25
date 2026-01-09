import { useCallback } from "react";
import { appSettings } from "../../store/1-ui-settings";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../ui/shadcn/resizable";
import { FileList } from "../1-file-list/0-file-list";
import { TraceList } from "../2-trace-viewer";

export function TraceMainView() {
    const savedSizes = appSettings.panelSizes;
    const defaultFilePanelSize = savedSizes?.[0] ?? 20;
    const defaultTracePanelSize = savedSizes?.[1] ?? 80;

    const handleLayout = useCallback(
        (layout: { [key: string]: number }) => {
            const sizes = [
                layout["file-list"],
                layout["trace-view"]
            ];
            appSettings.panelSizes = sizes;
        }, []
    );

    return (
        <ResizablePanelGroup className="h-full border-t" orientation="horizontal" onLayoutChange={handleLayout}
        >
            <ResizablePanel
                id="file-list"
                defaultSize={`${defaultFilePanelSize}`}
                minSize="15"
                maxSize="40"
                className="min-w-[200px]"
            >
                <FileList />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel
                id="trace-view"
                defaultSize={`${defaultTracePanelSize}`}
            >
                <div className="h-full overflow-hidden flex flex-col">
                    <TraceList />
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
