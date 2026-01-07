import { useSnapshot } from "valtio";
import { appSettings } from "../../store/1-ui-settings";
import { traceStore } from "../../store/traces-store/0-state";
import { TopMenu } from "./2-top-menu";
import { TraceMainView } from "./6-resizable-panels";
import { TraceEmptyState } from "../2-trace-viewer/7-trace-empty-state";
import { TraceFooter } from "./7-app-footer";
import { FileFilterDropdown, ButtonHighlightToggle } from "./3-btn-filters-select";
import { ButtonThemeToggle } from "./3-btn-theme-toggle";

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

            <div className="flex-1 flex flex-col overflow-hidden relative">
                {hasFile
                    ? <TraceMainView />
                    : <TraceEmptyState />
                }
            </div>

            {showFooter && hasFile && <TraceFooter />}
        </div>
    );
}

function TopMenuToolbar() {
    return (
        <div className="px-2 flex items-center gap-2">
            <FileFilterDropdown />
            <ButtonHighlightToggle />
            <ButtonThemeToggle />
        </div>
    );
}
