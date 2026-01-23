import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Button } from "../ui/shadcn/button";
import { Highlighter, Palette, Settings } from "lucide-react";
import { appSettings } from "../../store/1-ui-settings";
import { dialogEditHighlightsOpenAtom } from "../../store/2-ui-atoms";
import { highlightActions } from "../../store/5-highlight-rules";

export function ButtonHighlightToggle() {
    const { highlightEnabled } = useSnapshot(appSettings);
    const setEditHighlightsOpen = useSetAtom(dialogEditHighlightsOpenAtom);

    return (
        <div className="flex items-center rounded border border-border overflow-hidden h-6">
            <Button 
                className="p-0 size-6 rounded-none border-r border-r-border" 
                variant="ghost" 
                onClick={() => setEditHighlightsOpen(true)}
                title="Edit highlight rules"
            >
                {/* <Settings className="size-3.5" /> */}
                <Palette className="size-3.5 opacity-70" />
            </Button>

            <Button 
                className="p-0 size-6 rounded-none" 
                variant="ghost" 
                onClick={highlightActions.toggleHighlight}
                title={highlightEnabled ? "Disable highlighting" : "Enable highlighting"}
            >
                <Highlighter className={`size-3.5 ${highlightEnabled ? "text-foreground dark:text-sky-300 fill-sky-200 dark:fill-sky-500 opacity-100" : "opacity-40"}`} />
                {/* {highlightEnabled
                    ? <Palette className="size-3.5 opacity-70" />
                    : <Palette className="size-3.5 opacity-30" />
                } */}
            </Button>
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
