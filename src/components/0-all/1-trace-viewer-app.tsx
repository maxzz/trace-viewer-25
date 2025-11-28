import React from "react";
import { useSnapshot } from "valtio";
import { traceStore } from "../../store/trace-store";
import { appSettings } from "../../store/ui-settings";
import { TopMenu } from "./2-top-menu";
import { TraceMainView } from "./3-trace-main-view";
import { TraceEmptyState } from "./5-trace-empty-state";
import { TraceFooter } from "./4-trace-footer";

export function TraceViewerApp() {
    const { lines, error } = useSnapshot(traceStore);
    const { showFooter } = useSnapshot(appSettings);
    const hasFile = lines.length > 0 || !!error;

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <TopMenu />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {hasFile
                    ? <TraceMainView />
                    : <TraceEmptyState />
                }
            </div>

            {/* Footer - only shown when we have content and enabled in settings */}
            {hasFile && showFooter && <TraceFooter />}
        </div>
    );
}

//TODO: electron build
//TODO: dark mode and switch
//TODO: fix lines vertical padding
//TODO: thread column as line with dots. separate line for each thread and tooltip to show thread ID.
//TODO: filter by thread ID, errors, etc.
//TODO: PageUp/PageDown should preserve current line position on page if possible.
//TODO: add help dialog with keyboard shortcuts and other information.
