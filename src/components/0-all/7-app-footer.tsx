import { useSnapshot } from "valtio";
import { traceStore } from "../../store/traces-store/0-state";
import { selectionStore } from "../../store/traces-store/selection";
import { filesStore } from "../../store/traces-store/9-types-files-store";
import { appSettings } from "../../store/1-ui-settings";
import { Cpu } from "lucide-react";

export function TraceFooter() {
    const { viewLines, header, error } = useSnapshot(traceStore);
    const { selectedFileId } = useSnapshot(selectionStore);
    const { filesState } = useSnapshot(filesStore);
    const { extraInFooter } = useSnapshot(appSettings);
    const selectedFile = selectedFileId ? filesState.find(f => f.id === selectedFileId) : null;
    const errorCount = selectedFile?.data.errorCount || 0;

    return (
        <div className="text-xs text-muted-foreground bg-background border-t">
            {/* Error Banner */}
            {error && (
                <div className="p-4 bg-red-100 border-red-500 text-red-700 border-l-4" role="alert">
                    <p className="font-bold">Error loading trace</p>
                    <p>{error}</p>
                </div>
            )}

            {/* Metadata Bar */}
            <div className="p-2 pt-1 flex items-center gap-6">

                <div className="flex items-center gap-1">
                    <div className="ml-2 flex items-center gap-1">
                        <span>Loaded:</span>
                        <span className="py-0.5 rounded text-[10px]">{filesState.length}</span>
                    </div>

                    {extraInFooter && (<>
                        <div className="1ml-4 flex items-center gap-1">
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
                    </>)}

                    <div className="ml-2 flex items-center">
                        <Cpu className="mr-1 size-3" />
                        <span className="mr-1 font-semibold">File:</span>
                        <span>{viewLines.length.toLocaleString()} {plural(viewLines.length, 'line')}</span>

                        {errorCount > 0 && (<>
                            <span>, {errorCount.toLocaleString()} {plural(errorCount, 'error')}</span>
                        </>)}
                    </div>

                </div>

            </div>
        </div>
    );
}

function plural(n: number, word: string) {
    return n === 1 ? word : `${word}s`;
}
