import { atom } from 'jotai';
import { proxy } from 'valtio';

export const dialogOptionsOpenAtom = atom(false);
export const dialogAboutOpenAtom = atom(false);
export const dialogFileHeaderOpenAtom = atom(false);
export const dialogEditFiltersOpenAtom = atom(false);
// App title

export const defaultTitle = 'Trace Viewer';

export const appMainTitle = proxy<{ title: string }>({
    title: defaultTitle,
});
