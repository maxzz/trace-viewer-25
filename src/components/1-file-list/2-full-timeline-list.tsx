import { useEffect, useRef } from "react";
import { useSnapshot } from "valtio";
import { cn } from "@/utils/classnames";
import { ScrollArea } from "../ui/shadcn/scroll-area";
import { traceStore } from "@/store/traces-store/0-state";
import { appSettings } from "@/store/1-ui-settings";
import { cancelFullTimelineBuild } from "@/workers-client/timeline-client";

export function CombinedTimelinePanel() {
    const { showCombinedTimeline } = useSnapshot(appSettings);
    if (!showCombinedTimeline) {
        return null;
    }

    return <CombinedTimelineList />;
}

function CombinedTimelineList() {
    const { showCombinedTimeline, timelinePrecision } = useSnapshot(appSettings);
    const { files } = useSnapshot(traceStore);

    // Timeline build effect
    useEffect(() => {
        if (!showCombinedTimeline) {
            traceStore.setFullTimeline([]);
            return;
        }

        // Check if any file is still loading
        const isLoading = files.some(f => f.isLoading);
        if (isLoading) return;

        if (files.length === 0) {
            traceStore.setFullTimeline([]);
            return;
        }

        // Debounce build
        const timer = setTimeout(() => { traceStore.asyncBuildFullTimes(timelinePrecision); }, 300);

        return () => {
            clearTimeout(timer);
            cancelFullTimelineBuild();
        };
    }, [showCombinedTimeline, timelinePrecision, files]); // files dependency: if files loaded/added/removed

    return <FullTimelineList />;
}

function FullTimelineList() {
    const { timeline, selectedTimelineTimestamp } = useSnapshot(traceStore);
    const scrollRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // Auto-scroll to selected item
    useEffect(
        () => {
            if (selectedTimelineTimestamp && itemRefs.current.has(selectedTimelineTimestamp)) {
                itemRefs.current.get(selectedTimelineTimestamp)?.scrollIntoView({ behavior: 'auto', block: 'center' });
            }
        }, [selectedTimelineTimestamp]
    );

    let lastDate = "";

    return (
        <div className="w-max h-full bg-muted/10 border-r select-none flex flex-col">
            {/* <div className="text-xs p-1 font-bold border-b text-center text-muted-foreground bg-muted/20">
                Timeline
            </div> */}

            <ScrollArea className="flex-1">
                <div className="py-1 flex flex-col">
                    {timeline.map(
                        (item, idx) => {
                            const isSelected = item.timestamp === selectedTimelineTimestamp;
                            
                            // Parse timestamp to separate date and time
                            // Expected format: "MM/DD/YYYY HH:MM:SS.mmm" or "HH:MM:SS.mmm"
                            let displayTime = item.timestamp;
                            let currentDate = "";

                            if (item.timestamp.includes(' ')) {
                                const parts = item.timestamp.split(' ');
                                // Assuming format "Date Time"
                                if (parts.length >= 2) {
                                    currentDate = parts.slice(0, parts.length - 1).join(' ');
                                    displayTime = parts[parts.length - 1];
                                }
                            }

                            const showDateHeader = currentDate && currentDate !== lastDate;
                            if (currentDate) lastDate = currentDate;

                            return (
                                <div key={idx}>
                                    {showDateHeader && (
                                        <div className="mx-2 px-0.5 py-1 text-[10px] text-center font-bold text-foreground border border-muted-foreground/20 rounded shadow bg-sky-200">
                                            {currentDate}
                                        </div>
                                    )}
                                    <div
                                        className={cn(
                                            "text-[10px] px-1 py-0.5 cursor-pointer hover:bg-muted/50 truncate font-mono text-center",
                                            isSelected && "bg-primary text-primary-foreground hover:bg-primary/90"
                                        )}
                                        ref={(el) => {
                                            if (el) {
                                                itemRefs.current.set(item.timestamp, el);
                                            } else {
                                                itemRefs.current.delete(item.timestamp);
                                            }
                                        }}
                                        onClick={() => {
                                            traceStore.selectTimelineTimestamp(isSelected ? null : item.timestamp);
                                        }}
                                        title={item.timestamp}
                                    >
                                        {displayTime}
                                    </div>
                                </div>
                            );
                        }
                    )}
                    
                    {timeline.length === 0 && (
                        <div className="text-[10px] text-muted-foreground p-2 text-center">
                            No data
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
