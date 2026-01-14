import { proxy } from "valtio";

export interface FileListStore {
    selectedFileId: string | null;
}

export const fileListStore = proxy<FileListStore>({
    selectedFileId: null,
});
