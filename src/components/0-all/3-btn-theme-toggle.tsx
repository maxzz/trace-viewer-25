import { useSnapshot } from "valtio";
import { appSettings } from "../../store/1-ui-settings";
import { isThemeDark, toggleTheme } from "../../utils/theme-utils";
import { Button } from "../ui/shadcn/button";
import { IconThemeMoon, IconThemeSun } from "../ui/icons/normal";

export function ButtonThemeToggle() {
    const { theme } = useSnapshot(appSettings);
    const isDark = isThemeDark(theme);

    return (
        <Button
            className="size-6 focus-visible:1ring-0"
            variant="ghost"
            size="icon"
            onClick={() => toggleTheme(theme)}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            type="button"
        >
            {isDark
                ? <IconThemeSun className="size-4 stroke-1!" />
                : <IconThemeMoon className="size-4 stroke-1!" />
            }
        </Button>
    );
}
