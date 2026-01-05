import { atom } from 'jotai';
import { proxy } from 'valtio';

export const dialogOptionsOpenAtom = atom(false);
export const dialogAboutOpenAtom = atom(false);
export const dialogFileHeaderOpenAtom = atom(false);
export const dialogEditFiltersOpenAtom = atom(false);
// App title

export const defaultTitle = 'Trace Viewer';

export const appMainTitle = proxy<{ title: string; openFolderName?: string }>({
    title: defaultTitle,
    openFolderName: '',
});

export const setAppTitle = (files: File[], droppedFolderName?: string) => {
    let folderName = '';

    if (droppedFolderName) {
        folderName = droppedFolderName;
    } else if (files.length > 0) {
        // Check for common path in webkitRelativePath
        const paths = files.map(f => f.webkitRelativePath);
        if (!paths.some(p => !p)) { // All files have relative path
             const splitPaths = paths.map(p => p.split('/'));
             const commonParts: string[] = [];
             
             if (splitPaths.length > 0) {
                 const refPath = splitPaths[0];
                 // Check segments up to the second to last (exclude filename)
                 // Note: if webkitRelativePath is just "filename", split is ["filename"], length 1. Loop i < 0 doesn't run. Correct.
                 for (let i = 0; i < refPath.length - 1; i++) {
                     const part = refPath[i];
                     if (splitPaths.every(p => p.length > i && p[i] === part)) {
                         commonParts.push(part);
                     } else {
                         break;
                     }
                 }
             }
             folderName = commonParts.join('/');
        }
    }

    let title = defaultTitle;
    if (folderName) {
        title = `${defaultTitle} - ${folderName}`;
    } else if (files.length === 1) {
        title = `${defaultTitle} - ${files[0].name}`;
    } else if (files.length > 1) {
         title = `${defaultTitle} - ${files.length} files`;
    }

    appMainTitle.title = title;
    appMainTitle.openFolderName = folderName;
};
