import { useEffect, useRef } from "react";
import { useSnapshot } from "valtio";
import { cn } from "../../utils/classnames";
import { ScrollArea } from "../ui/shadcn/scroll-area";
import { traceStore } from "../../store/traces-store/0-state";

export function TimelineList() {
    const { timeline, selectedTimelineTimestamp } = useSnapshot(traceStore);
    const scrollRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // Auto-scroll to selected item
    useEffect(
        () => {
            if (selectedTimelineTimestamp && itemRefs.current.has(selectedTimelineTimestamp)) {
                itemRefs.current.get(selectedTimelineTimestamp)?.scrollIntoView({
                    behavior: 'auto',
                    block: 'center'
                });
            }
        }, [selectedTimelineTimestamp]
    );

    return (
        <div className="flex flex-col h-full bg-muted/10 border-l w-28 select-none">
            <div className="text-xs p-1 font-bold border-b text-center text-muted-foreground bg-muted/20">Timeline</div>
            <ScrollArea className="flex-1">
                <div className="flex flex-col py-1">
                    {timeline.map(
                        (item, idx) => (
                            <div
                                key={idx}
                                ref={el => {
                                    if (el) itemRefs.current.set(item.timestamp, el);
                                    else itemRefs.current.delete(item.timestamp);
                                }}
                                className={cn(
                                    "text-[10px] px-2 py-0.5 cursor-pointer hover:bg-muted/50 truncate font-mono text-center",
                                    item.timestamp === selectedTimelineTimestamp && "bg-primary text-primary-foreground hover:bg-primary/90"
                                )}
                                onClick={() => traceStore.selectTimelineTimestamp(item.timestamp)}
                                title={item.timestamp}
                            >
                                {item.timestamp}
                            </div>
                        )
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
