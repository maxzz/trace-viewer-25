import { atomEffect } from "jotai-effect";
import { subscribe } from "valtio";
import { subscribeKey } from "valtio/utils";
import { appSettings } from "../1-ui-settings";
import { traceStore } from "./0-state";
import { filesStore } from "./9-types-files-store";
import { cancelFullTimelineBuild } from "../../workers-client/all-times-client";

export const listenerToBuildAllTimesEffectAtom = atomEffect(
    (get, set) => {
        const unsubShow = subscribeKey(appSettings.allTimes, 'show', runBuildAlltimes);
        const unsubPrecision = subscribeKey(appSettings.allTimes, 'precision', runBuildAlltimes);
        const unsubFilesData = subscribe(filesStore.filesData, runBuildAlltimes);

        return () => {
            unsubShow();
            unsubPrecision();
            unsubFilesData();
            cancelFullTimelineBuild();
        };
    }
);

export function runBuildAlltimes() {
    const { show, precision } = appSettings.allTimes;
    const { filesData } = filesStore;

    if (!show) {
        traceStore.setAllTimes([]);
        cancelFullTimelineBuild();
        return;
    }

    const files = Object.values(filesData);

    const someFileIsLoading = files.some(f => f.isLoading);
    if (someFileIsLoading) {
        return;
    }

    if (files.length === 0) {
        traceStore.setAllTimes([]);
        return;
    }

    traceStore.asyncBuildAllTimes(precision);
}
