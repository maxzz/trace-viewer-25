import { useSnapshot } from "valtio";
import { appSettings } from "../../store/ui-settings";
import { traceStore } from "../../store/traces-store/0-state";
import { TopMenu } from "./2-top-menu";
import { TopMenuToolbar } from "./2-top-menu-toolbar";
import { TraceMainView } from "./3-trace-main-view";
import { TraceEmptyState } from "./5-trace-empty-state";
import { TraceFooter } from "./4-trace-footer";

export function TraceViewerApp() {
    const { files, error } = useSnapshot(traceStore);
    const { showFooter } = useSnapshot(appSettings);
    const hasFile = files.length > 0;

    return (
        <div className="h-full text-xs flex flex-col overflow-hidden">
            <div className="flex items-center justify-between">
                <TopMenu />
                <TopMenuToolbar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {hasFile
                    ? <TraceMainView />
                    : <TraceEmptyState />
                }
            </div>

            {/* Footer - only shown when we have content and enabled in settings */}
            {hasFile && showFooter && <TraceFooter />}
        </div>
    );
}

//TODO: electron build
//TODO: dark mode and switch
//TODO: fix lines vertical padding
//TODO: thread column as line with dots. separate line for each thread and tooltip to show thread ID.
//TODO: filter by thread ID, errors, etc.
//TODO: PageUp/PageDown should preserve current line position on page if possible.
//TODO: add help dialog with keyboard shortcuts and other information.
