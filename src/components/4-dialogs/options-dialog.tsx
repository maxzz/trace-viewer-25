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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Options</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="show-footer"
                            checked={settings.showFooter}
                            onCheckedChange={handleShowFooterChange}
                        />
                        <Label htmlFor="show-footer">Show Footer</Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

