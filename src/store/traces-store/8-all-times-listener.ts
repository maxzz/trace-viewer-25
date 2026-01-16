import { atomEffect } from "jotai-effect";
import { subscribe } from "valtio";
import { subscribeKey } from "valtio/utils";
import { appSettings } from "../1-ui-settings";
import { allTimesStore } from "./3-all-times-store";
import { filesStore } from "./9-types-files-store";
import { cancelAllTimesBuild } from "../../workers-client/all-times-client";

export const listenerToBuildAllTimesEffectAtom = atomEffect(
    (get, set) => {
        const unsubShow = subscribeKey(appSettings.allTimes, 'show', buildAlltimes);
        
        const unsubPrecision = subscribeKey(appSettings.allTimes, 'precision', () => {
            appSettings.allTimes.needToRebuild = true;
            buildAlltimes();
        });

        const unsubFilesData = subscribe(filesStore.states, (ops) => {
            const isIgnorable = ops.every((op) => {
                const path = op[1];
                return path.length >= 2 && path[1] === 'matchedHighlightIds';
            });

            if (isIgnorable) {
                return;
            }

            appSettings.allTimes.needToRebuild = true;
            buildAlltimes();
        });

        return () => {
            unsubShow();
            unsubPrecision();
            unsubFilesData();
            cancelAllTimesBuild();
        };
    }
);

export function buildAlltimes() {
    const { show, precision, needToRebuild } = appSettings.allTimes;
    // const { quickFileData } = filesStore; // Use states directly

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
        allTimesStore.setAllTimes([]);
        appSettings.allTimes.needToRebuild = false; // not valid and needs to be rebuilt
        return;
    }

    if (!needToRebuild && allTimesStore.allTimes.length > 0) {
        return;
    }

    // Use states directly to determine if we have files, as it is the primary source of truth
    const hasFiles = filesStore.states.length > 0;
    const someFileIsLoading = filesStore.states.some(f => f.data.isLoading);

    if (someFileIsLoading) {
        return;
    }

    if (!hasFiles) {
        allTimesStore.setAllTimes([]);
        appSettings.allTimes.needToRebuild = false; // "Built" empty
        return;
    }

    allTimesStore.asyncBuildAllTimes(precision).then(() => {
        appSettings.allTimes.needToRebuild = false;
    });
}
