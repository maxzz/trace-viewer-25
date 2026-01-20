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
    const { showFooter, useIconsForEntryExit, showLineNumbers, extraInFooter, allTimes, historyLimit, startupFilePattern } = useSnapshot(appSettings);

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
                        Show line numbers in the trace file
                    </Label>

                    <div className="mt-2 font-semibold">All times options:</div>

                    <Label className="text-xs font-normal flex items-center space-x-1">
                        <Checkbox className="size-5" checked={allTimes.show} onCheckedChange={handleShowTimelineChange} />
                        Show all times column
                    </Label>

                    <Label className="text-xs font-normal flex items-center space-x-1">
                        <Checkbox className="size-5" checked={allTimes.showBuildDoneNotice} onCheckedChange={handleShowTimelineNotificationChange} />
                        Show notification when all times is built
                    </Label>

                    <Label className="text-xs font-normal flex items-center space-x-1">
                        <Checkbox className="size-5" checked={allTimes.onLeft} onCheckedChange={handleCombinedOnLeftChange} />
                        Show on the left of the file list
                    </Label>

                    <div className="-mt-1 pl-7 flex items-center space-x-2">
                        <Label className="text-xs font-normal text-balance">
                            All times precision
                        </Label>
                        <Input className="w-12 h-6 text-xs p-1" value={allTimes.precision} onChange={handleTimelinePrecisionChange} min={0} max={5} type="number" />
                    </div>

                    <div className="mt-2 font-semibold">Footer options:</div>

                    <Label className="text-xs font-normal flex items-center space-x-1">
                        <Checkbox className="size-5" checked={showFooter} onCheckedChange={handleShowFooterChange} />
                        Show footer
                    </Label>

                    <Label className="text-xs font-normal flex items-center space-x-1">
                        <Checkbox className="size-5" checked={extraInFooter} onCheckedChange={handleExtraInFooterChange} />
                        Show info from the file header in the footer
                    </Label>

                    <div className="mt-2 font-semibold">History options:</div>

                    <Label className="text-xs font-normal flex items-center space-x-1">
                        Max history items
                        <Input className="w-12 h-6 text-xs p-1" value={historyLimit} onChange={handleHistoryLimitChange} min={1} max={100} type="number" />
                    </Label>

                    <div className="mt-2 font-semibold">Startup options:</div>

                    <Label className="text-xs font-normal flex flex-col gap-1">
                        <span>Select file pattern on start:</span>
                        <Input 
                            className="h-6 text-xs p-1" 
                            value={startupFilePattern} 
                            onChange={handleStartupPatternChange} 
                            placeholder="e.g. *.dll.* or /regex/"
                        />
                        <span className="text-muted-foreground text-[10px]">
                            Use * for wildcard or /pattern/ for regex
                        </span>
                    </Label>
                </div>

                <DialogFooter className="justify-center!">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}

function handleShowFooterChange(checked: boolean) {
    appSettings.showFooter = checked;
}

function handleUseIconsChange(checked: boolean) {
    appSettings.useIconsForEntryExit = checked;
}

function handleExtraInFooterChange(checked: boolean) {
    appSettings.extraInFooter = checked;
}

function handleShowLineNumbersChange(checked: boolean) {
    appSettings.showLineNumbers = checked;
}

function handleHistoryLimitChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
        appSettings.historyLimit = val;
    }
}

function handleShowTimelineChange(checked: boolean) {
    appSettings.allTimes.show = checked;
}

function handleCombinedOnLeftChange(checked: boolean) {
    appSettings.allTimes.onLeft = checked;
}

function handleTimelinePrecisionChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 0 && val <= 5) {
        appSettings.allTimes.precision = val;
    }
}

function handleShowTimelineNotificationChange(checked: boolean) {
    appSettings.allTimes.showBuildDoneNotice = checked;
}

function handleStartupPatternChange(e: React.ChangeEvent<HTMLInputElement>) {
    appSettings.startupFilePattern = e.target.value;
}
