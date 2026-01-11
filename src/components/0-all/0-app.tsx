import { DropItDoc } from "../ui/local-ui/6-dnd/ui-drop-it-doc";
import { Toaster } from "../ui/local-ui/7-toaster";
import { UISymbolDefs } from "../ui/icons";
import { doSetFilesFrom_Dnd_Atom } from "../ui/local-ui/6-dnd/8-dnd-atoms";
import { TraceViewerApp } from "./1-trace-viewer-app";
import { AppGlobals } from "../4-dialogs/0-app-globals";
import { DialogAbout } from "../4-dialogs/3-dialog-about";
import { DialogOptions } from "../4-dialogs/1-dialog-options";
import { DialogFileHeader } from "../4-dialogs/2-dialog-file-header";
import { DialogEditFilters } from "../4-dialogs/4-dialog-edit-filters";
import { DialogEditHighlightRules } from "../4-dialogs/5-dialog-edit-highlight-rules";
import { ZipLoadingOverlay } from "../ui/local-ui/zip-loading-overlay";

export function App() {
    return (
        <div className="h-screen w-screen bg-background overflow-hidden">
            <UISymbolDefs />
            <AppGlobals />
            <Toaster />
            <ZipLoadingOverlay />
            <DropItDoc doSetFilesFromDropAtom={doSetFilesFrom_Dnd_Atom} />

            <TraceViewerApp />
            <Dialogs />
        </div>
    );
}

function Dialogs() {
    return (<>
        <DialogFileHeader />
        <DialogAbout />
        <DialogOptions />
        <DialogEditFilters />
        <DialogEditHighlightRules />
    </>);
}
