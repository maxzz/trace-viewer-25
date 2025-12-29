import { DropItDoc } from "../ui/local-ui/6-dnd/ui-drop-it-doc";
import { Toaster } from "../ui/local-ui/7-toaster";
import { doSetFilesFrom_Dnd_Atom } from "../ui/local-ui/6-dnd/8-atoms";
import { TraceViewerApp } from "./1-trace-viewer-app";
import { UISymbolDefs } from "../ui/icons";
import { AboutDialog } from "../4-dialogs/3-about-dialog";
import { OptionsDialog } from "../4-dialogs/1-options-dialog";
import { FileHeaderDialog } from "../4-dialogs/2-file-header-dialog";
import { useAtom } from "jotai";
import { fileHeaderOpenAtom, aboutOpenAtom, optionsOpenAtom } from "../../store/ui-atoms";

export function App() {
    return (
        <div className="h-screen w-screen overflow-hidden bg-background">
            <UISymbolDefs />
            <Toaster />
            <DropItDoc doSetFilesFromDropAtom={doSetFilesFrom_Dnd_Atom} />

            <TraceViewerApp />
            <Dialogs />
        </div>
    );
}

function Dialogs() {
    const [optionsOpen, setOptionsOpen] = useAtom(optionsOpenAtom);
    const [aboutOpen, setAboutOpen] = useAtom(aboutOpenAtom);
    const [fileHeaderOpen, setFileHeaderOpen] = useAtom(fileHeaderOpenAtom);

    return (<>
        <FileHeaderDialog open={fileHeaderOpen} onOpenChange={setFileHeaderOpen} />
        <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
        <OptionsDialog open={optionsOpen} onOpenChange={setOptionsOpen} />
    </>);
}