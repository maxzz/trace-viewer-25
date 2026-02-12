import { useAtomValue, useSetAtom, atom } from "jotai";
import { useSnapshot } from "valtio";
import { listenerToBuildAllTimesEffectAtom } from "@/store/traces-store/8-all-times-listener";
import { appSettings } from "../../store/1-ui-settings";
import { TopMenu } from "./2-top-menu";
import { TraceMainView } from "./6-resizable-panels";
import { TraceFooter } from "./7-footer";
import { FileFilterDropdown } from "./3-btn-filters-select";
import { ButtonThemeToggle } from "./3-btn-theme-toggle";
import { filesCountAtom } from "@/store/6-filtered-files";
import { canGoBackAtom, canGoForwardAtom, historyActions } from "@/store/traces-store/0-files-history";
import { currentFileStateAtom } from "@/store/traces-store/0-files-current-state";
import { Button } from "../ui/shadcn/button";
import { IconBinocular, IconChevronLeft, IconL_ArrowLeft } from "../ui/icons";
import { TimelineProgress } from "./4-loading-progress";
import { ButtonHighlightToggle } from "./3-btn-highlight-toggle";
import { Switch } from "../ui/shadcn/switch";
import { Label } from "../ui/shadcn/label";
import { classNames } from "@/utils";
import { setCurrentFileShowOnlySelectedThreadAtom } from "@/store/traces-store/2-thread-filter-cache";
import { setShowOnlyErrorsInSelectedFileAtom, showOnlyErrorsInSelectedFileAtom } from "@/store/7-errors-only-setting";

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
                <ThreadOnlyToggle />
                <ErrorsOnlyToggle />
                <ButtonHighlightToggle />
                <FileFilterDropdown />
                <ButtonThemeToggle />
            </div>
        </div>
    );
}

const fallbackShowOnlySelectedThreadAtom = atom(false);
const fallbackLineIndexAtom = atom(-1);

function ThreadOnlyToggle() {
    const currentFileState = useAtomValue(currentFileStateAtom);
    const showOnlySelectedThread = useAtomValue(currentFileState?.showOnlySelectedThreadAtom ?? fallbackShowOnlySelectedThreadAtom);
    const setShowOnlySelectedThread = useSetAtom(setCurrentFileShowOnlySelectedThreadAtom);
    const currentLineIndex = useAtomValue(currentFileState?.currentLineIdxAtom ?? fallbackLineIndexAtom);

    const disabled = !currentFileState || currentLineIndex < 0;

    return (
        <Label
            className={classNames("px-1 h-6 font-normal border-border rounded border select-none gap-1", disabled && "opacity-50")}
            data-disabled={disabled}
            title={disabled ? "Select a line to enable thread-only view" : "Show only lines from the selected thread"}
        >
            Thread
            <Switch
                className={classNames("border border-foreground/10", disabled && "disabled:opacity-100")}
                checked={showOnlySelectedThread}
                onCheckedChange={setShowOnlySelectedThread}
                disabled={disabled}
            />
        </Label>
    );
}

function ErrorsOnlyToggle() {
    const currentFileState = useAtomValue(currentFileStateAtom);
    const setShowOnlyErrorsInSelectedFile = useSetAtom(setShowOnlyErrorsInSelectedFileAtom);
    const showOnlyErrors = useAtomValue(showOnlyErrorsInSelectedFileAtom);

    const disabled = !currentFileState;
    const errorsCount = currentFileState?.data.errorsInTraceCount ?? 0;

    return (
        <Label
            className={classNames("px-1 h-6 font-normal border-border rounded border select-none gap-1", disabled && "opacity-50")}
            data-disabled={disabled}
            title={disabled ? "Select a file to enable errors-only view" : `Show only error lines (${errorsCount} errors)`}
        >
            Errors
            <Switch
                className={classNames("border border-foreground/10", disabled && "disabled:opacity-100")}
                checked={showOnlyErrors}
                onCheckedChange={setShowOnlyErrorsInSelectedFile}
                disabled={disabled}
            />
        </Label>
    );
}

function ButtonHistoryBack() {
    const canGoBack = useAtomValue(canGoBackAtom);
    return (
        <Button
            className="group size-6 rounded-l rounded-r-none"
            variant="ghost"
            size="icon"
            onClick={historyActions.goBack}
            disabled={!canGoBack}
            title="Go Back"
        >
            <IconL_ArrowLeft className="size-3.5 stroke-foreground/50 group-disabled:opacity-30" />
        </Button>
    );
}

function ButtonHistoryForward() {
    const canGoForward = useAtomValue(canGoForwardAtom);
    return (
        <Button
            className="group size-6 rounded-r rounded-l-none border-l-0"
            variant="ghost"
            size="icon"
            onClick={historyActions.goForward}
            disabled={!canGoForward}
            title="Go Forward"
        >
            <IconL_ArrowLeft className="size-3.5 rotate-180 stroke-foreground/50 group-disabled:opacity-30" />
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
