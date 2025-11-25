import React from "react";
import { TraceList } from "../1-trace-viewer/2-trace-list";

export function TraceMainView() {
    return (
        /* Trace List */
        <div className="flex-1 overflow-hidden">
            <TraceList />
        </div>
    );
}
