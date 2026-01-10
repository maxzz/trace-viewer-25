import { atomEffect } from "jotai-effect";
import { subscribe } from "valtio";
import { appSettings } from "../1-ui-settings";
import { traceStore } from "./0-state";
import { filesStore } from "./9-types-files-store";
import { cancelFullTimelineBuild } from "../../workers-client/timeline-client";

export const listenerToBuildFullTimelineAtom = atomEffect(
    (get, set) => {
        // Initial run
        //runBuild();

        // Subscribe to stores
        // subscribe returns an unsubscribe function
        const unsub1 = subscribe(appSettings, runBuildFullTimeline);
        const unsub2 = subscribe(filesStore.traceFilesData, runBuildFullTimeline);

        return () => {
            unsub1();
            unsub2();
            cancelFullTimelineBuild();
        };
    }
);

export function runBuildFullTimeline() {
    console.log("runBuild");
    const { showCombinedTimeline, timelinePrecision } = appSettings;
    const { traceFilesData  } = filesStore;

    if (!showCombinedTimeline) {
        traceStore.setFullTimeline([]);
        cancelFullTimelineBuild();
        return;
    }

    // Check if any file is still loading
    const isLoading = Object.values(traceFilesData).some(f => f.isLoading);
    if (isLoading) return;

    if (Object.values(traceFilesData).length === 0) {
        traceStore.setFullTimeline([]);
        return;
    }

    // Debounce build

    traceStore.asyncBuildFullTimes(timelinePrecision);
}
