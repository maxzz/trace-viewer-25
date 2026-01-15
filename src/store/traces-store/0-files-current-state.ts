import { proxy } from "valtio";
import { type FileState } from "./9-types-files-store";

export interface FilesListStore {
    // Current file
    currentFileState: FileState | null;         // Active file state (mirrored from selected file)
}

export const filesListStore = proxy<FilesListStore>({
    currentFileState: null,
});
