import { atomEffect } from "jotai-effect";
import { subscribe } from "valtio";
import { subscribeKey } from "valtio/utils";
import { appSettings } from "../1-ui-settings";
import { allTimesStore } from "./3-all-times-store";
import { filesStore } from "./9-types-files-store";
import { cancelAllTimesBuild } from "../../workers-client/all-times-client";

export const listenerToBuildAllTimesEffectAtom = atomEffect(
    (get, set) => {
        const unsubShow = subscribeKey(appSettings.allTimes, 'show', runBuildAlltimes);
        
        const unsubPrecision = subscribeKey(appSettings.allTimes, 'precision', () => {
            appSettings.allTimes.needToRebuild = true;
            runBuildAlltimes();
        });

        const unsubFilesData = subscribe(filesStore.states, () => {
            appSettings.allTimes.needToRebuild = true;
            runBuildAlltimes();
        });

        return () => {
            unsubShow();
            unsubPrecision();
            unsubFilesData();
            cancelAllTimesBuild();
        };
    }
);

export function runBuildAlltimes() {
    const { show, precision, needToRebuild } = appSettings.allTimes;
    const { quickFileData } = filesStore;

    if (!show) {
        // Don't clear if hidden, just don't build?
        // User logic: "When toggled ... show if it was built then don't need to rebuild it."
        // implies we keep the data if we hide it?
        // But previously we cleared it: traceStore.setAllTimes([]);
        // If we clear it, we MUST rebuild it when shown.
        // So we should NOT clear it if we want to avoid rebuild.
        
        // However, if I remove `traceStore.setAllTimes([])` here, then the memory is held.
        // Maybe the user wants to keep it in memory.
        
        // But if I clear it, then `needToRebuild` must be true next time?
        // Or `needToRebuild` tracks if *inputs* changed.
        // If inputs haven't changed, but I cleared the output, I still need to rebuild to show it.
        
        // If the user wants to avoid rebuild, I must NOT clear the data when hiding.
        
        cancelAllTimesBuild();
        return;
    }

    if (!needToRebuild && allTimesStore.allTimes.length > 0) {
        return;
    }

    const files = Object.values(quickFileData);

    const someFileIsLoading = files.some(f => f.isLoading);
    if (someFileIsLoading) {
        return;
    }

    if (files.length === 0) {
        allTimesStore.setAllTimes([]);
        appSettings.allTimes.needToRebuild = false; // "Built" empty
        return;
    }

    allTimesStore.asyncBuildAllTimes(precision).then(() => {
        appSettings.allTimes.needToRebuild = false;
    });
}
