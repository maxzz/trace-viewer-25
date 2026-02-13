import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@/utils";
import { appSettings } from "@/store/1-ui-settings";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";
import { Label } from "@/components/ui/shadcn/label";
import { Switch } from "@/components/ui/shadcn/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/dialog";
import { errorsNavConfirmDlgOnCancelAtom, errorsNavConfirmDlgOnOKAtom, currentFileErrorsNavPositionAtom, errorsNavConfirmDlgAtom, goToNextErrorAtom, goToPrevErrorAtom } from "@/store/traces-store/4-1-error-navigation";
import { currentFileStateAtom } from "@/store/traces-store/0-1-files-current-state";

export function ErrorsNavControls() {
    const currentFileState = useAtomValue(currentFileStateAtom);
    const { current, total } = useAtomValue(currentFileErrorsNavPositionAtom);
    const goPrev = useSetAtom(goToPrevErrorAtom);
    const goNext = useSetAtom(goToNextErrorAtom);

    const disabled = !currentFileState || total === 0;

    return (
        <div className={classNames("h-6 flex items-center", disabled && "opacity-50")} data-disabled={disabled}>
            <Button
                className="group size-6 rounded-r-none"
                variant="ghost"
                size="icon"
                title="Previous error"
                disabled={disabled}
                onClick={() => goPrev()}
            >
                <ChevronUp className="size-3.5 stroke-foreground/50 group-disabled:opacity-30" />
            </Button>
            <div className="px-1 h-6 text-[10px] font-mono tabular-nums text-muted-foreground border-y border-border select-none flex items-center justify-center">
                {current}/{total}
            </div>
            <Button
                className="group size-6 rounded-l-none"
                variant="ghost"
                size="icon"
                title="Next error"
                disabled={disabled}
                onClick={() => goNext()}
            >
                <ChevronDown className="size-3.5 stroke-foreground/50 group-disabled:opacity-30" />
            </Button>
        </div>
    );
}

export function DialogErrorsNavWrap() {
    const [state, setState] = useAtom(errorsNavConfirmDlgAtom);
    const confirm = useSetAtom(errorsNavConfirmDlgOnOKAtom);
    const cancel = useSetAtom(errorsNavConfirmDlgOnCancelAtom);
    const { showErrorsNavigationWrapDialog } = useSnapshot(appSettings);

    const isNext = state?.direction === "next";
    const open = !!state;
    const dontShowAgain = !showErrorsNavigationWrapDialog;

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) { setState(null); } }}
        >
            <DialogContent className="max-w-[360px]!" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle className="text-sm">
                        {isNext ? "Reached end of file" : "Reached start of file"}
                    </DialogTitle>
                </DialogHeader>

                <Label className="h-6 text-xs font-normal select-none gap-2 flex items-center justify-between">
                    Don't show it again
                    <Switch
                        className="border border-foreground/10"
                        checked={dontShowAgain}
                        onCheckedChange={(checked) => {
                            appSettings.showErrorsNavigationWrapDialog = !checked;
                        }}
                    />
                </Label>

                <DialogFooter className="justify-end!">
                    <Button variant="outline" onClick={() => cancel()}>Cancel</Button>
                    <Button onClick={() => confirm()}>{isNext ? "Go to start" : "Go to end"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
