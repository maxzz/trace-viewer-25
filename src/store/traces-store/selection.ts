import { proxy } from "valtio";

export interface SelectionStore {
    selectedFileId: string | null;
}

export const selectionStore = proxy<SelectionStore>({
    selectedFileId: null,
});
