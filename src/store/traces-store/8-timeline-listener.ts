import { atomEffect } from "jotai-effect";
import { subscribe } from "valtio";
import { appSettings } from "../1-ui-settings";
import { traceStore } from "./0-state";
import { filesStore } from "./9-types-files-store";
import { cancelFullTimelineBuild } from "../../workers-client/timeline-client";

export const timelineBuildListenerAtom = atomEffect(
    (get, set) => {
        let timer: ReturnType<typeof setTimeout>;

        function runBuild() {
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
            clearTimeout(timer);
            timer = setTimeout(() => { traceStore.asyncBuildFullTimes(timelinePrecision); }, 100);
        }

        // Initial run
        runBuild();

        // Subscribe to stores
        // subscribe returns an unsubscribe function
        const unsub1 = subscribe(appSettings, runBuild);
        const unsub2 = subscribe(filesStore.traceFilesData, runBuild);

        return () => {
            unsub1();
            unsub2();
            clearTimeout(timer);
            cancelFullTimelineBuild();
        };
    }
);
