import { useSnapshot } from "valtio";
import { appSettings } from "@/store/1-ui-settings";
import { classNames, cn } from "@/utils/classnames";
import { traceStore } from "@/store/traces-store/0-state";
import { ScrollArea } from "../ui/shadcn/scroll-area";
import { Fragment } from "react/jsx-runtime";

export function AllTimesPanel() {
    const { allTimes } = useSnapshot(appSettings);
    if (!allTimes.show) {
        return null;
    }

    return <AllTimesList />;
}

function AllTimesList() {
    const { onLeft } = useSnapshot(appSettings.allTimes);
    const { allTimes, allTimesSelectedTimestamp: selectedAllTimesTimestamp } = useSnapshot(traceStore);

    let lastDate = "";

    return (
        <div className={classNames("w-max h-full bg-muted/10 select-none flex flex-col", onLeft ? "border-r" : "border-l")}>
            <ScrollArea className="flex-1">
                <div className="flex flex-col">
                    {allTimes.map(
                        (item, idx) => {
                            const isSelected = item.timestamp === selectedAllTimesTimestamp;
                            const { displayTime, currentDate } = splitTimestampIntoDateAndTime(item.timestamp);

                            const showDateHeader = currentDate && currentDate !== lastDate;
                            if (currentDate) lastDate = currentDate;

                            return (<Fragment key={idx}>
                                    {showDateHeader && (
                                        <div className={dateHeaderClasses} key={`date-header-${item.timestamp}`}>
                                            {currentDate}
                                        </div>
                                    )}
                                    <div
                                        className={cn(rowClasses, isSelected && "bg-primary text-primary-foreground hover:bg-primary/90")}
                                        onClick={() => traceStore.setAllTimesSelectedTimestamp(isSelected ? null : item.timestamp)}
                                        title={item.timestamp}
                                        key={item.timestamp}
                                    >
                                        {displayTime}
                                    </div>
                                </Fragment>
                            );
                        }
                    )}

                    {allTimes.length === 0 && (
                        <div className="text-[10px] text-muted-foreground p-2 text-center">
                            No data
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

const dateHeaderClasses = "mx-2 px-0.5 h-5 text-[10px] text-center font-bold text-foreground dark:text-background bg-green-200 border border-muted-foreground/20 rounded shadow flex items-center justify-center";
const rowClasses = "h-5 text-[10px] px-2.5 py-0.5 cursor-pointer hover:bg-muted/50 truncate font-mono text-center flex items-center justify-center";

function splitTimestampIntoDateAndTime(timestamp: string): { displayTime: string; currentDate: string; } {
    // Parse timestamp to separate date and time. Expected format: "MM/DD/YYYY HH:MM:SS.mmm" or "HH:MM:SS.mmm"

    let displayTime = timestamp;
    let currentDate = "";

    if (timestamp.includes(' ')) {
        const parts = timestamp.split(' ');
        // Assuming format "Date Time"
        if (parts.length >= 2) {
            currentDate = parts.slice(0, parts.length - 1).join(' ');
            displayTime = parts[parts.length - 1];
        }
    }

    return { displayTime, currentDate };
}
