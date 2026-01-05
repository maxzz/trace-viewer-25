import { useAtom } from 'jotai';
import { useSnapshot } from 'valtio';
import { appSettings } from '@/store/1-ui-settings';
import { dialogOptionsOpenAtom } from '@/store/2-ui-atoms';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ui/shadcn/dialog';
import { Button } from '@/components/ui/shadcn/button';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { Label } from '@/components/ui/shadcn/label';

export function DialogOptions() {
    const [open, onOpenChange] = useAtom(dialogOptionsOpenAtom);
    const settings = useSnapshot(appSettings);

    const handleShowFooterChange = (checked: boolean) => {
        appSettings.showFooter = checked;
    };

    const handleUseIconsChange = (checked: boolean) => {
        appSettings.useIconsForEntryExit = checked;
    };

    const handleExtraInFooterChange = (checked: boolean) => {
        appSettings.extraInFooter = checked;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="text-sm">Options</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <Label className="text-xs font-normal flex items-center space-x-1">
                        <Checkbox className="size-5" checked={settings.showFooter} onCheckedChange={handleShowFooterChange} />
                        Show Footer
                    </Label>

                    <Label className="text-xs font-normal flex items-center space-x-1">
                        <Checkbox className="p-1 size-5" checked={settings.useIconsForEntryExit} onCheckedChange={handleUseIconsChange} />
                        Use Icons for Entry/Exit lines
                    </Label>

                    <Label className="text-xs font-normal flex items-center space-x-1">
                        <Checkbox className="size-5" checked={settings.extraInFooter} onCheckedChange={handleExtraInFooterChange} />
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
