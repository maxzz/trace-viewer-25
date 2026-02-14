import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "../../store/1-ui-settings";
import { IconBinocular } from "../ui/icons";
import { TraceFooter } from "./7-footer";
import { ErrorsNavControls } from "./3-2-btn-nav-errors";
import { ToggleErrorsOnly, ToggleErrorsWithoutNoise, ToggleThreadOnly } from "./2-top-menu-toggles";
import { ButtonHighlightToggle } from "./3-4-btn-highlight-toggle";
import { FileFilterDropdown } from "./3-3-btn-filters-select";
import { ButtonThemeToggle } from "./3-5-btn-theme-toggle";
import { TimelineProgress } from "./4-loading-progress";
import { ButtonHistoryBack, ButtonHistoryForward } from "./3-1-btn-nav-history";

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
