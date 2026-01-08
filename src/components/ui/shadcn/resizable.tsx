"use client"; // 01.07.26
import * as React from "react";
import { cn } from "@/utils/index";
import { GripVerticalIcon } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";

export function ResizablePanelGroup({ className, ...props }: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) {
    return (
        <ResizablePrimitive.PanelGroup
            data-slot="resizable-panel-group"
            className={cn("w-full h-full flex data-[panel-group-direction=vertical]:flex-col", className)}
            {...props}
        />
    );
}

export function ResizablePanel({ ...props }: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
    return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />;
}

export function ResizableHandle({ withHandle, className, ...props }: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & { withHandle?: boolean; }) {
    return (
        <ResizablePrimitive.PanelResizeHandle
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
        </ResizablePrimitive.PanelResizeHandle>
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
data-[panel-group-direction=vertical]:pb-0 \
data-[panel-group-direction=vertical]:w-full \
data-[panel-group-direction=vertical]:h-px \
data-[panel-group-direction=vertical]:items-center \
\
data-[panel-group-direction=vertical]:after:left-0 \
data-[panel-group-direction=vertical]:after:h-1 \
data-[panel-group-direction=vertical]:after:w-full \
data-[panel-group-direction=vertical]:after:translate-x-0 \
data-[panel-group-direction=vertical]:after:-translate-y-1/2 \
\
[&[data-panel-group-direction=vertical]>div]:rotate-90 \
\
flex items-end justify-center";
