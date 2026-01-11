import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { listenerToBuildAllTimesEffectAtom } from "@/store/traces-store/8-all-times-listener";
import { appSettings } from "../../store/1-ui-settings";
import { filesStore } from "../../store/traces-store/9-types-files-store";
import { TopMenu } from "./2-top-menu";
import { TraceMainView } from "./6-resizable-panels";
import { TraceEmptyState } from "../2-trace-viewer/7-trace-empty-state";
import { TraceFooter } from "./7-app-footer";
import { FileFilterDropdown, ButtonHighlightToggle } from "./3-btn-filters-select";
import { ButtonThemeToggle } from "./3-btn-theme-toggle";

export function TraceViewerApp() {
    useAtomValue(listenerToBuildAllTimesEffectAtom);

    const { filesData } = useSnapshot(filesStore);
    const hasFile = Object.keys(filesData).length > 0;

    //const { error } = useSnapshot(traceStore);

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

            <Footer hasFile={hasFile} />
        </div>
    );
}

function TopMenuToolbar() {
    return (
        <div className="px-2 flex items-center gap-2">
            <ButtonHighlightToggle />
            <FileFilterDropdown />
            <ButtonThemeToggle />
        </div>
    );
}

function Footer({ hasFile }: { hasFile: boolean }) {
    const { showFooter } = useSnapshot(appSettings);
   return (<>
        {showFooter && hasFile && <TraceFooter />}
    </>);
}
