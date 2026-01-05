import { useAtom } from 'jotai';
import { useSnapshot } from 'valtio';
import { appSettings } from '@/store/1-ui-settings';
import { dialogOptionsOpenAtom } from '@/store/2-ui-atoms';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/shadcn/dialog';
import { Button } from '@/components/ui/shadcn/button';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { Label } from '@/components/ui/shadcn/label';

export function DialogOptions() {
    const [open, onOpenChange] = useAtom(dialogOptionsOpenAtom);
    const { showFooter, useIconsForEntryExit, showLineNumbers, extraInFooter } = useSnapshot(appSettings);

    const handleShowFooterChange = (checked: boolean) => {
        appSettings.showFooter = checked;
    };

    const handleUseIconsChange = (checked: boolean) => {
        appSettings.useIconsForEntryExit = checked;
    };

    const handleExtraInFooterChange = (checked: boolean) => {
        appSettings.extraInFooter = checked;
    };

    const handleShowLineNumbersChange = (checked: boolean) => {
        appSettings.showLineNumbers = checked;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[300px]!" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle className="text-sm">
                        Options
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4 text-xs grid gap-2">
                    Trace viewer options:

                    <Label className="text-xs font-normal flex items-center space-x-1">
                        <Checkbox className="size-5" checked={useIconsForEntryExit} onCheckedChange={handleUseIconsChange} />
                        Use Icons for Entry/Exit lines
                    </Label>

                    <Label className="text-xs font-normal flex items-center space-x-1">
                        <Checkbox className="size-5" checked={showLineNumbers} onCheckedChange={handleShowLineNumbersChange} />
                        Show Line numbers
                    </Label>

                    Footer options:

                    <Label className="text-xs font-normal flex items-center space-x-1">
                        <Checkbox className="size-5" checked={showFooter} onCheckedChange={handleShowFooterChange} />
                        Show Footer
                    </Label>

                    <Label className="text-xs font-normal flex items-center space-x-1">
                        <Checkbox className="size-5" checked={extraInFooter} onCheckedChange={handleExtraInFooterChange} />
                        Show header info in footer
                    </Label>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}
