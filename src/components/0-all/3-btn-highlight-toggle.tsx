import { Button } from "../ui/shadcn/button";
import { useSnapshot } from "valtio";
import { appSettings } from "../../store/1-ui-settings";
import { highlightActions } from "../../store/5-highlight-rules";
import { Palette } from "lucide-react";

export function ButtonHighlightToggle() {
    const { highlightEnabled } = useSnapshot(appSettings);

    return (
        <Button 
            className="size-6 rounded" 
            variant="ghost" 
            size="icon" 
            onClick={highlightActions.toggleHighlight}
            title={highlightEnabled ? "Disable highlighting" : "Enable highlighting"}
        >
            {highlightEnabled
                ? <Palette className="size-3.5 opacity-70" />
                : <Palette className="size-3.5 opacity-30" />
            }
        </Button>
    );
}
