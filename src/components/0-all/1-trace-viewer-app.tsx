import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { listenerToBuildAllTimesEffectAtom } from "@/store/traces-store/8-all-times-listener";
import { appSettings } from "../../store/1-ui-settings";
import { TopMenu } from "./2-top-menu";
import { TraceMainView } from "./6-resizable-panels";
import { TraceEmptyView } from "../2-trace-viewer/7-trace-empty-view";
import { TraceFooter } from "./7-footer";
import { FileFilterDropdown, ButtonHighlightToggle } from "./3-btn-filters-select";
import { ButtonThemeToggle } from "./3-btn-theme-toggle";
import { filesCountAtom } from "@/store/6-filtered-files";

export function TraceViewerApp() {
    useAtomValue(listenerToBuildAllTimesEffectAtom);

    const fileCount = useAtomValue(filesCountAtom);
    //const { error } = useSnapshot(traceStore);

    return (
        <div className="h-full text-xs flex flex-col overflow-hidden">
            <div className="flex items-center justify-between">
                <TopMenu />
                <TopMenuToolbar />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden relative">
                {!!fileCount
                    ? <TraceMainView />
                    : <TraceEmptyView />
                }
            </div>

            <Footer hasFile={!!fileCount} />
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

function Footer({ hasFile }: { hasFile: boolean; }) {
    const { showFooter } = useSnapshot(appSettings);
    return (<>
        {showFooter && hasFile && <TraceFooter />}
    </>);
}
