"use client"; // 01.07.26
import * as React from "react";
import { cn } from "@/utils/index";
import { GripVerticalIcon } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";

export function ResizablePanelGroup({ className, ...props }: React.ComponentProps<typeof Group>) {
    return (
        <Group
            data-slot="resizable-panel-group"
            className={cn("w-full h-full flex data-[panel-group-direction=vertical]:flex-col group/panel-group", className)}
            data-panel-group-direction={props.orientation}
            {...props}
        />
    );
}

export function ResizablePanel({ ...props }: React.ComponentProps<typeof Panel>) {
    return <Panel data-slot="resizable-panel" {...props} />;
}

export function ResizableHandle({ withHandle, className, ...props }: React.ComponentProps<typeof Separator> & { withHandle?: boolean; }) {
    return (
        <Separator
            data-slot="resizable-handle"
            className={cn(
                resizableLineClasses,
                className
            )}
            {...props}
        >
            {withHandle && (
                <div className={resizableHandleClasses}>
                    <GripVerticalIcon className="size-2.5" />
                </div>
            )}
        </Separator>
    );
}

const resizableHandleClasses = "w-3 h-4 bg-border border rounded-xs opacity-0 transition-opacity delay-200 duration-300 group-hover:opacity-100 flex items-center justify-center z-50";

const resizableLineClasses = "\
group \
relative \
pb-3 \
w-px \
bg-border \
focus-visible:ring-ring \
\
hover:bg-blue-500 \
transition-all \
\
after:absolute \
after:inset-y-0 \
after:left-1/2 \
after:w-1 \
after:-translate-x-1/2 \
\
focus-visible:ring-1 \
focus-visible:ring-offset-1 \
focus-visible:outline-hidden \
\
group-data-[panel-group-direction=vertical]/panel-group:pb-0 \
group-data-[panel-group-direction=vertical]/panel-group:w-full \
group-data-[panel-group-direction=vertical]/panel-group:h-px \
group-data-[panel-group-direction=vertical]/panel-group:items-center \
\
group-data-[panel-group-direction=vertical]/panel-group:after:left-0 \
group-data-[panel-group-direction=vertical]/panel-group:after:h-1 \
group-data-[panel-group-direction=vertical]/panel-group:after:w-full \
group-data-[panel-group-direction=vertical]/panel-group:after:translate-x-0 \
group-data-[panel-group-direction=vertical]/panel-group:after:-translate-y-1/2 \
\
group-data-[panel-group-direction=vertical]/panel-group:[&>div]:rotate-90 \
\
flex items-end justify-center";
