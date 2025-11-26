import { useSnapshot } from 'valtio';
import { appSettings } from '../../store/ui-settings';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, } from '../ui/shadcn/dialog';
import { Button } from '../ui/shadcn/button';
import { Checkbox } from '../ui/shadcn/checkbox';
import { Label } from '../ui/shadcn/label';

interface OptionsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function OptionsDialog({ open, onOpenChange }: OptionsDialogProps) {
    const settings = useSnapshot(appSettings);

    const handleShowFooterChange = (checked: boolean) => {
        appSettings.showFooter = checked;
    };

    const handleUseIconsChange = (checked: boolean) => {
        appSettings.useIconsForEntryExit = checked;
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
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
