import { useSnapshot } from "valtio";
import { traceStore } from "../../store/traces-store/0-state";
import { Cpu, Clock, AlertCircle } from "lucide-react";

export function TraceFooter() {
    const { lines, header, error, files, selectedFileId } = useSnapshot(traceStore);
    const selectedFile = selectedFileId ? files.find(f => f.id === selectedFileId) : null;
    const errorCount = selectedFile?.errorCount || 0;

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
                    <span className="text-foreground">💻</span>
                    <span className="font-semibold">Computer:</span>
                    <span className="">
                        {header.machineName || "Trace Viewer"}
                    </span>

                    {header.os && <>
                        <span className="font-semibold">OS:</span>
                        <span>{header.os}</span></>
                    }

                    {header.compiled && (
                        <div className="ml-4 flex items-center gap-1">
                            <Clock className="size-3" />
                            <span className="font-semibold">Compiled:</span>
                            <span>{header.compiled}</span>
                        </div>
                    )}

                    <div className="ml-4 flex items-center gap-1">
                        <Cpu className="size-3" />
                        <span className="font-semibold">Lines:</span>
                        <span>{lines.length.toLocaleString()}</span>
                    </div>

                    {errorCount > 0 && (
                        <div className="ml-4 flex items-center gap-1 text-red-600 dark:text-red-400">
                            <AlertCircle className="size-3" />
                            <span className="font-semibold">Errors:</span>
                            <span>{errorCount.toLocaleString()}</span>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

