import { atom } from "jotai";
import { currentFileStateAtom } from "./0-1-files-current-state";
import { excludeNoiseErrorsInSelectedFileAtom } from "../8-errors-noise-setting";

export const currentFileErrorsCountAtom = atom(
    (get) => {
        const fileState = get(currentFileStateAtom);
        if (!fileState) return 0;

        const excludeNoise = get(excludeNoiseErrorsInSelectedFileAtom);
        return excludeNoise
            ? (fileState.data.errorsInTraceCountWithoutNoise ?? 0)
            : (fileState.data.errorsInTraceCount ?? 0);
    }
);

