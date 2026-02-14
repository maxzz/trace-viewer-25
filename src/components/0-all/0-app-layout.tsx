import { DropItDoc } from "../ui/local-ui/6-dnd/ui-drop-it-doc";
import { Toaster } from "../ui/local-ui/7-toaster";
import { UISymbolDefs } from "../ui/icons";
import { doSetFilesFrom_Dnd_Atom } from "../ui/local-ui/6-dnd/8-dnd-atoms";
import { AppGlobals } from "../4-dialogs/0-app-globals";
import { DialogAbout } from "../4-dialogs/3-dialog-about";
import { DialogOptions } from "../4-dialogs/1-dialog-options";
import { DialogFileHeader } from "../4-dialogs/2-dialog-file-header";
import { DialogEditFilters } from "../4-dialogs/4-dialog-edit-filters";
import { DialogEditHighlightRules } from "../4-dialogs/5-dialog-edit-highlight-rules";
import { ZipLoadingOverlay } from "../ui/local-ui/zip-loading-overlay";
import { DialogErrorsNavWrap } from "./3-2-btn-errors-nav";
import { useAtomValue } from "jotai";
import { listenerToBuildAllTimesEffectAtom } from "@/store/traces-store/3-2-all-times-listener";
import { filesCountAtom } from "@/store/6-filtered-files";
import { TopMenu } from "./2-top-menu";
import { TraceMainView } from "./6-resizable-panels";
import { Footer, NoFilesView, TopMenuToolbar } from "./1-app-view";
// import { SpyAllIcons } from "@/utils/util-hooks/spy-all-icons";

export function App() {
    return (
        <div className="h-screen w-screen bg-background overflow-hidden">
            <UISymbolDefs />
            <AppGlobals />
            <Toaster />
            <ZipLoadingOverlay />
            <DropItDoc doSetFilesFromDropAtom={doSetFilesFrom_Dnd_Atom} />

            {/* <SpyAllIcons includeSvgSymbols /> */}
            <TraceViewerApp />
            <Dialogs />
        </div>
    );
}

export function TraceViewerApp() {
    useAtomValue(listenerToBuildAllTimesEffectAtom);

    const fileCount = useAtomValue(filesCountAtom);
    //const { error } = useSnapshot(traceStore);

    return (
        <div className="h-full text-xs flex flex-col overflow-hidden">
            <div className="bg-background flex items-center justify-between">
                <TopMenu />
                <TopMenuToolbar />
            </div>
        
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {!fileCount
                    ? <NoFilesView />
                    : <TraceMainView />
                }
            </div>

            <Footer hasFile={!!fileCount} />
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
        <DialogErrorsNavWrap />
    </>);
}
