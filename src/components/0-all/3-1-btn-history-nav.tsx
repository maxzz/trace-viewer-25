import { useAtomValue } from "jotai";
import { canGoBackAtom, canGoForwardAtom, historyActions } from "@/store/traces-store/0-3-files-history";
import { Button } from "@/components/ui/shadcn/button";
import { IconL_ArrowLeft } from "@/components/ui/icons";

export function ButtonHistoryBack() {
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

export function ButtonHistoryForward() {
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

