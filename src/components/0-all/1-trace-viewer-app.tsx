import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { listenerToBuildAllTimesEffectAtom } from "@/store/traces-store/8-all-times-listener";
import { appSettings } from "../../store/1-ui-settings";
import { TopMenu } from "./2-top-menu";
import { TraceMainView } from "./6-resizable-panels";
import { TraceFooter } from "./7-footer";
import { FileFilterDropdown, ButtonHighlightToggle } from "./3-btn-filters-select";
import { ButtonThemeToggle } from "./3-btn-theme-toggle";
import { filesCountAtom } from "@/store/6-filtered-files";
import { canGoBackAtom, canGoForwardAtom, historyActions } from "@/store/traces-store/0-files-history";
import { Button } from "../ui/shadcn/button";
import { IconBinocular, IconChevronLeft } from "../ui/icons";
import { TimelineProgress } from "./4-loading-progress";

export function TraceViewerApp() {
    useAtomValue(listenerToBuildAllTimesEffectAtom);

    const fileCount = useAtomValue(filesCountAtom);
    //const { error } = useSnapshot(traceStore);

    return (
        <div className="h-full text-xs flex flex-col overflow-hidden">
            <div className="bg-background flex items-center justify-between">
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
        <div className="flex-1 px-2 flex items-center justify-between gap-2">
            <div className="flex items-center">
                <ButtonHistoryBack />
                <ButtonHistoryForward />
                <TimelineProgress />
            </div>
            <div className="px-2 flex items-center gap-2">
                <ButtonHighlightToggle />
                <FileFilterDropdown />
                <ButtonThemeToggle />
            </div>
        </div>
    );
}

function ButtonHistoryBack() {
    const canGoBack = useAtomValue(canGoBackAtom);
    return (
        <Button
            className="size-6 rounded-l rounded-r-none"
            variant="outline"
            size="icon"
            onClick={historyActions.goBack}
            disabled={!canGoBack}
            title="Go Back"
        >
            <IconChevronLeft className="size-4" />
        </Button>
    );
}

function ButtonHistoryForward() {
    const canGoForward = useAtomValue(canGoForwardAtom);
    return (
        <Button
            className="size-6 rounded-r rounded-l-none border-l-0"
            variant="outline"
            size="icon"
            onClick={historyActions.goForward}
            disabled={!canGoForward}
            title="Go Forward"
        >
            <IconChevronLeft className="size-4 rotate-180" />
        </Button>
    );
}

function Footer({ hasFile }: { hasFile: boolean; }) {
    const { showFooter } = useSnapshot(appSettings);
    return (<>
        {showFooter && hasFile && <TraceFooter />}
    </>);
}

function TraceEmptyView() {
    return (
        <div className="absolute inset-0 bg-foreground/5 flex flex-col items-center justify-center pointer-events-none">
            <IconBinocular className="size-8" />
            <p className="max-w-76 text-center text-xs text-foreground">
                Drag and drop the .trc3 file, folder, ZIP archive, or use the file selection dialog to view the traces.
            </p>
        </div>
    );
}
