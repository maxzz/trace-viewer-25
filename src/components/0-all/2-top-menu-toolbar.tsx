import { ToggleErrorsOnly, ToggleErrorsWithoutNoise, ToggleThreadOnly } from "./3-0-top-menu-toggles";
import { ButtonHistoryBack, ButtonHistoryForward } from "./3-1-btn-nav-history";
import { ErrorsNavControls } from "./3-2-btn-nav-errors";
import { FileFilterDropdown } from "./3-3-btn-filters-select";
import { ButtonHighlightToggle } from "./3-4-btn-highlight-toggle";
import { ButtonThemeToggle } from "./3-5-btn-theme-toggle";
import { TimelineProgress } from "./4-loading-progress";

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
