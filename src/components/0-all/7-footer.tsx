import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio";
import { filesListStore } from "../../store/traces-store/0-files-current-state";
import { filesStore } from "../../store/traces-store/9-types-files-store";
import { appSettings } from "../../store/1-ui-settings";
import { filesCountAtom } from "../../store/6-filtered-files";
import { Cpu } from "lucide-react";

export function TraceFooter() {
    return (
        <div className="text-xs text-muted-foreground bg-background border-t">
            <FooterErrorBanner />

            {/* Metadata Bar */}
            <div className="p-2 pt-1 flex items-center gap-6">

                <div className="flex items-center gap-1">
                    <div className="ml-2 flex items-center gap-1">
                        <span>Loaded:</span>
                        <FooterFilesCount />
                    </div>

                    <FooterExtraInfo />

                    <div className="ml-2 flex items-center">
                        <Cpu className="mr-1 size-3" />
                        <span className="mr-1 font-semibold">File:</span>
                        <FooterLineCount />
                        <FooterErrorCount />
                    </div>

                </div>

            </div>
        </div>
    );
}

function FooterErrorBanner() {
    const { currentFileState } = useSnapshot(filesListStore);
    const error = currentFileState?.data?.errorLoadingFile;

    if (!error) {
        return null;
    }

    return (
        <div className="p-4 bg-red-100 border-red-500 text-red-700 border-l-4" role="alert">
            <p className="font-bold">Error loading trace</p>
            <p>{error}</p>
        </div>
    );
}

function FooterExtraInfo() {
    const { extraInFooter } = useSnapshot(appSettings);
    const { currentFileState } = useSnapshot(filesListStore);
    const header = currentFileState?.data?.header || { magic: '' };

    if (!extraInFooter) {
        return null;
    }

    return (
        <>
            <div className="ml-4 flex items-center gap-1">
                <span className="pt-0.5 text-[0.6rem]">💻 Computer:</span>
                <span className="pt-0.5 text-[0.6rem]">
                    {header.machineName || "Trace Viewer"}
                </span>
            </div>

            <div className="flex items-center gap-1">
                {header.os && (<>
                    <span className="pt-0.5 text-[0.6rem]">OS:</span>
                    <span className="pt-0.5 text-[0.6rem]">{header.os}</span>
                </>)
                }

                {header.compiled && (<>
                    <span className="pt-0.5 text-[0.6rem]">Compiled:</span>
                    <span className="pt-0.5 text-[0.6rem]">{header.compiled}</span>
                </>)}
            </div>
        </>
    );
}

function FooterFilesCount() {
    const fileCount = useAtomValue(filesCountAtom);
    return <span className="py-0.5 rounded text-[10px]">{fileCount}</span>;
}

function FooterLineCount() {
    const { currentFileState } = useSnapshot(filesListStore);
    const viewLines = currentFileState?.data?.viewLines || [];
    const lineCount = viewLines.length;

    return (
        <span>{lineCount.toLocaleString()} {plural(lineCount, 'line')}</span>
    );
}

function FooterErrorCount() {
    const { currentFileState } = useSnapshot(filesListStore);
    const errorCount = currentFileState?.data.errorsInTraceCount || 0;

    if (errorCount === 0) {
        return null;
    }

    return (
        <span>, {errorCount.toLocaleString()} {plural(errorCount, 'error')}</span>
    );
}

function plural(n: number, word: string) {
    return n === 1 ? word : `${word}s`;
}
