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
    const { showFooter, useIconsForEntryExit, showLineNumbers, extraInFooter, showCombinedTimeline, combinedOnLeft, timelinePrecision } = useSnapshot(appSettings);

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

    const handleCombinedOnLeftChange = (checked: boolean) => {
        appSettings.combinedOnLeft = checked;
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

                <div className="py-2 text-xs grid gap-2">
                    <div className="font-semibold">Trace viewer options:</div>

                    <Label className="text-xs font-normal flex items-center space-x-1">
                        <Checkbox className="size-5" checked={useIconsForEntryExit} onCheckedChange={handleUseIconsChange} />
                        Use Icons for Entry/Exit lines
                    </Label>

                    <Label className="text-xs font-normal flex items-center space-x-1">
                        <Checkbox className="size-5" checked={showLineNumbers} onCheckedChange={handleShowLineNumbersChange} />
                        Show Line numbers
                    </Label>

                    <div className="mt-2 font-semibold">Combined timeline options:</div>

                    <Label className="text-xs font-normal flex items-center space-x-1">
                        <Checkbox className="size-5" checked={showCombinedTimeline} onCheckedChange={handleShowTimelineChange} />
                        Show combined timeline
                    </Label>

                    <Label className="text-xs font-normal flex items-center space-x-1">
                        <Checkbox className="size-5" checked={combinedOnLeft} onCheckedChange={handleCombinedOnLeftChange} />
                        Show on the left of the file list
                    </Label>

                    <div className="-mt-1 pl-7 flex items-center space-x-2">
                        <Label className="text-xs font-normal text-balance">
                            Combined timeline precision
                        </Label>
                        <Input className="w-12 h-6 text-xs p-1" value={timelinePrecision} onChange={handleTimelinePrecisionChange} min={0} max={5} type="number" />
                    </div>

                    <div className="mt-2 font-semibold">Footer options:</div>

                    <Label className="text-xs font-normal flex items-center space-x-1">
                        <Checkbox className="size-5" checked={showFooter} onCheckedChange={handleShowFooterChange} />
                        Show Footer
                    </Label>

                    <Label className="text-xs font-normal flex items-center space-x-1">
                        <Checkbox className="size-5" checked={extraInFooter} onCheckedChange={handleExtraInFooterChange} />
                        Show header info in footer
                    </Label>
                </div>

                <DialogFooter className="justify-center!">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}
