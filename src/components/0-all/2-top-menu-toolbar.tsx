import { useAtomValue, useSetAtom, atom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@/utils";
import { appSettings } from "../../store/1-ui-settings";
import { Label } from "../ui/shadcn/label";
import { Switch } from "../ui/shadcn/switch";
import { IconBinocular } from "../ui/icons";
import { TraceFooter } from "./7-footer";
import { ErrorsNavControls } from "./3-2-btn-nav-errors";
import { ButtonHighlightToggle } from "./3-4-btn-highlight-toggle";
import { FileFilterDropdown } from "./3-3-btn-filters-select";
import { ButtonThemeToggle } from "./3-5-btn-theme-toggle";
import { TimelineProgress } from "./4-loading-progress";
import { ButtonHistoryBack, ButtonHistoryForward } from "./3-1-btn-nav-history";
import { currentFileStateAtom } from "@/store/traces-store/0-1-files-current-state";
import { setCurrentFileShowOnlySelectedThreadAtom } from "@/store/traces-store/0-4-thread-filter-cache";
import { setShowOnlyErrorsInSelectedFileAtom, showOnlyErrorsInSelectedFileAtom } from "@/store/7-errors-only-setting";
import { excludeNoiseErrorsInSelectedFileAtom, setExcludeNoiseErrorsInSelectedFileAtom } from "@/store/8-errors-noise-setting";
import { currentFileErrorsCountAtom } from "@/store/traces-store/4-3-errors-count";
import { allFilesErrorsTotalsAtom } from "@/store/traces-store/4-4-errors-totals";

export function TopMenuToolbar() {
    return (
        <div className="flex-1 px-2 flex items-center justify-between gap-2">
            <div className="flex items-center">
                <ButtonHistoryBack />
                <ButtonHistoryForward />
                <TimelineProgress />
            </div>
            <div className="px-2 flex items-center gap-2">
                <ErrorsNavControls />
                <ToggleErrorsOnly />
                <ToggleErrorsWithoutNoise />
                <ToggleThreadOnly />
                <FileFilterDropdown />
                <ButtonHighlightToggle />
                <ButtonThemeToggle />
            </div>
        </div>
    );
}

const fallbackShowOnlySelectedThreadAtom = atom(false);
const fallbackLineIndexAtom = atom(-1);

type ToggleLabelSwitchProps = {
    label: string;
    checked: boolean;
    disabled: boolean;
    title: string;
    onCheckedChange: (checked: boolean) => void;
};

function ToggleLabelSwitch({ label, checked, disabled, title, onCheckedChange }: ToggleLabelSwitchProps) {
    return (
        <Label
            className={classNames("px-1 h-6 font-normal border-border rounded border select-none gap-1", disabled && "opacity-50")}
            data-disabled={disabled}
            title={title}
        >
            {label}
            <Switch
                className={classNames("border border-foreground/10", disabled && "disabled:opacity-100")}
                checked={checked}
                onCheckedChange={onCheckedChange}
                disabled={disabled}
            />
        </Label>
    );
}

function ToggleThreadOnly() {
    const currentFileState = useAtomValue(currentFileStateAtom);
    const showOnlySelectedThread = useAtomValue(currentFileState?.showOnlySelectedThreadAtom ?? fallbackShowOnlySelectedThreadAtom);
    const setShowOnlySelectedThread = useSetAtom(setCurrentFileShowOnlySelectedThreadAtom);
    const currentLineIndex = useAtomValue(currentFileState?.currentLineIdxAtom ?? fallbackLineIndexAtom);

    const disabled = !currentFileState || currentLineIndex < 0;

    return (
        <ToggleLabelSwitch
            label="Thread"
            checked={showOnlySelectedThread}
            disabled={disabled}
            title={disabled ? "Select a line to enable thread-only view" : "Show only lines from the selected thread"}
            onCheckedChange={setShowOnlySelectedThread}
        />
    );
}

function ToggleErrorsOnly() {
    const currentFileState = useAtomValue(currentFileStateAtom);
    const showOnlyErrors = useAtomValue(showOnlyErrorsInSelectedFileAtom);
    const setShowOnlyErrorsInSelectedFile = useSetAtom(setShowOnlyErrorsInSelectedFileAtom);

    const disabled = !currentFileState;
    const errorsCount = useAtomValue(currentFileErrorsCountAtom);

    return (
        <ToggleLabelSwitch
            label="Errors"
            checked={showOnlyErrors}
            disabled={disabled}
            title={disabled ? "Select a file to enable errors-only view" : `Show only error lines (${errorsCount} errors)`}
            onCheckedChange={setShowOnlyErrorsInSelectedFile}
        />
    );
}

function ToggleErrorsWithoutNoise() {
    const currentFileState = useAtomValue(currentFileStateAtom);
    const excludeNoiseErrors = useAtomValue(excludeNoiseErrorsInSelectedFileAtom);
    const setExcludeNoiseErrors = useSetAtom(setExcludeNoiseErrorsInSelectedFileAtom);

    const disabled = !currentFileState;
    const errorsCount = useAtomValue(currentFileErrorsCountAtom);
    const allFilesErrorsTotals = useAtomValue(allFilesErrorsTotalsAtom);

    return (
        <ToggleLabelSwitch
            label="Noise"
            checked={excludeNoiseErrors}
            disabled={disabled}
            title={disabled
                ? "Select a file to configure error filtering"
                : (excludeNoiseErrors
                    ? `Noise errors are hidden (file: ${errorsCount}, all: ${allFilesErrorsTotals.errorsCountWithoutNoise}/${allFilesErrorsTotals.errorsCount})`
                    : `Noise errors are shown (all: ${allFilesErrorsTotals.errorsCountWithoutNoise}/${allFilesErrorsTotals.errorsCount}, includes 0x80070002)`)
            }
            onCheckedChange={setExcludeNoiseErrors}
        />
    );
}

export function Footer({ hasFile }: { hasFile: boolean; }) {
    const { showFooter } = useSnapshot(appSettings);
    return (<>
        {showFooter && hasFile && <TraceFooter />}
    </>);
}

export function NoFilesView() {
    return (
        <div className="absolute inset-0 bg-foreground/5 flex flex-col items-center justify-center pointer-events-none">
            <IconBinocular className="size-8" />
            <p className="max-w-76 text-center text-xs text-foreground">
                Drag and drop the .trc3 file, folder, ZIP archive, or use the file selection dialog to view the traces.
            </p>
        </div>
    );
}
