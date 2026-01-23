import { Button } from "../ui/shadcn/button";
import { useSnapshot } from "valtio";
import { useSetAtom } from "jotai";
import { appSettings } from "../../store/1-ui-settings";
import { highlightActions } from "../../store/5-highlight-rules";
import { dialogEditHighlightsOpenAtom } from "../../store/2-ui-atoms";
import { Highlighter, Palette, Settings } from "lucide-react";

export function ButtonHighlightToggle() {
    const { highlightEnabled } = useSnapshot(appSettings);
    const setEditHighlightsOpen = useSetAtom(dialogEditHighlightsOpenAtom);

    return (
        <div className="flex items-center rounded-md border border-border overflow-hidden h-6">
            <Button 
                className="h-6 w-6 rounded-none border-0 border-r border-r-border rounded-l-md p-0" 
                variant="ghost" 
                onClick={() => setEditHighlightsOpen(true)}
                title="Edit highlight rules"
            >
                <Settings className="size-3.5" />
            </Button>
            <Button 
                className="h-6 w-6 rounded-none rounded-r-md p-0" 
                variant="ghost" 
                onClick={highlightActions.toggleHighlight}
                title={highlightEnabled ? "Disable highlighting" : "Enable highlighting"}
            >11
                {highlightEnabled
                    ? <Palette className="size-3.5 opacity-70" />
                    : <Palette className="size-3.5 opacity-30" />
                }
            </Button>1134
        </div>
    );
}

export function ButtonHighlightToggle2() {
    const { highlightEnabled, highlightRules } = useSnapshot(appSettings);
    const hasRules = highlightRules.length > 0;

    return (
        <Button 
            className={`size-6 rounded` + (highlightEnabled ? " dark:bg-foreground/20" : "")}
            variant="outline"
            size="icon" 
            onClick={highlightActions.toggleHighlight}
            disabled={!hasRules}
            title={highlightEnabled ? "Disable highlighting" : "Enable highlighting"}
        >
            <Highlighter className={`size-3.5 ${highlightEnabled ? "text-foreground dark:text-sky-300 fill-sky-200 dark:fill-sky-500 opacity-100" : "opacity-40"}`} />
        </Button>
    );
}
