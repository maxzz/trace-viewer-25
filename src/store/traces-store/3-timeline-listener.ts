import { atomEffect } from "jotai-effect";
import { subscribe } from "valtio";
import { appSettings } from "../1-ui-settings";
import { traceStore } from "./0-state";
import { filesStore } from "./2-files-store";
import { cancelFullTimelineBuild } from "../../workers-client/timeline-client";

export const timelineBuildListenerAtom = atomEffect((get, set) => {
    let timer: ReturnType<typeof setTimeout>;

    const runBuild = () => {
        const { showCombinedTimeline, timelinePrecision } = appSettings;
        const { traceFiles } = filesStore;

        if (!showCombinedTimeline) {
            traceStore.setFullTimeline([]);
            cancelFullTimelineBuild();
            return;
        }

        // Check if any file is still loading
        const isLoading = traceFiles.some(f => f.isLoading);
        if (isLoading) return;

        if (traceFiles.length === 0) {
            traceStore.setFullTimeline([]);
            return;
        }

        // Debounce build
        clearTimeout(timer);
        timer = setTimeout(() => { traceStore.asyncBuildFullTimes(timelinePrecision); }, 300);
    };

    // Initial run
    runBuild();

    // Subscribe to stores
    // subscribe returns an unsubscribe function
    const unsub1 = subscribe(appSettings, runBuild);
    const unsub2 = subscribe(filesStore, runBuild);

    return () => {
        unsub1();
        unsub2();
        clearTimeout(timer);
        cancelFullTimelineBuild();
    };
});
