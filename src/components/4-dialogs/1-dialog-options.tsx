import { useAtom } from 'jotai';
import { useSnapshot } from 'valtio';
import { appSettings } from '@/store/1-ui-settings';
import { dialogOptionsOpenAtom } from '@/store/2-ui-atoms';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/shadcn/dialog';
import { Input } from '@/components/ui/shadcn/input';
import { Button } from '@/components/ui/shadcn/button';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { Label } from '@/components/ui/shadcn/label';

export function DialogOptions() {
    const [open, onOpenChange] = useAtom(dialogOptionsOpenAtom);
    const { showFooter, useIconsForEntryExit, showLineNumbers, extraInFooter, showCombinedTimeline, timelinePrecision } = useSnapshot(appSettings);

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

    const handleShowTimelineChange = (checked: boolean) => {
        appSettings.showCombinedTimeline = checked;
    };

    const handleTimelinePrecisionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val) && val >= 0 && val <= 5) {
            appSettings.timelinePrecision = val;
        }
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

                    Timeline options:

                    <Label className="text-xs font-normal flex items-center space-x-1">
                        <Checkbox className="size-5" checked={showCombinedTimeline} onCheckedChange={handleShowTimelineChange} />
                        Show Combined Timeline
                    </Label>

                    <div className="flex items-center space-x-2 pl-6">
                        <Label className="text-xs font-normal">
                            Precision (0-5 digits to hide):
                        </Label>
                        <Input
                            type="number"
                            className="w-12 h-6 text-xs p-1"
                            min={0}
                            max={5}
                            value={timelinePrecision}
                            onChange={handleTimelinePrecisionChange}
                        />
                    </div>

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
