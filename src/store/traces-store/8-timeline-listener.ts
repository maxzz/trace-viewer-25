import { atomEffect } from "jotai-effect";
import { subscribe } from "valtio";
import { appSettings } from "../1-ui-settings";
import { traceStore } from "./0-state";
import { filesStore } from "./9-types-files-store";
import { cancelFullTimelineBuild } from "../../workers-client/all-times-client";

export const listenerToBuildFullTimelineAtom = atomEffect(
    (get, set) => {
        const unsubSettings = subscribe(appSettings, runBuildAlltimes);
        const unsubFilesData = subscribe(filesStore, runBuildAlltimes);

        return () => {
            unsubSettings();
            unsubFilesData();
            cancelFullTimelineBuild();
        };
    }
);

export function runBuildAlltimes() {
    console.log("runBuildFullTimeline");

    const { showCombinedTimeline, timelinePrecision } = appSettings;
    const { filesData } = filesStore;

    if (!showCombinedTimeline) {
        traceStore.setFullTimeline([]);
        cancelFullTimelineBuild();
        return;
    }

    const files = Object.values(filesData);

    const someFileIsLoading = files.some(f => f.isLoading);
    if (someFileIsLoading) {
        return;
    }

    if (files.length === 0) {
        traceStore.setFullTimeline([]);
        return;
    }

    traceStore.asyncBuildAllTimes(timelinePrecision);
}
