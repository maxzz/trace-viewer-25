import { useEffect } from "react";
import { useSnapshot } from "valtio";
import { appSettings } from "../../store/1-ui-settings";
import { traceStore } from "../../store/traces-store/0-state";
import { FullTimelineList } from "./2-full-timeline-list";
import { cancelFullTimelineBuild } from "../../workers-client/timeline-client";

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
