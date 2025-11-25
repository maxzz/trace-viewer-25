import React from "react";
import { useSnapshot } from "valtio";
import { traceStore } from "../../store/trace-store";
import { FileText, Cpu, Clock } from "lucide-react";

export function TraceFooter() {
    const { lines, header, error } = useSnapshot(traceStore);

    return (
        <div className="border-t bg-background">
            {/* Error Banner */}
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                    <p className="font-bold">Error loading trace</p>
                    <p>{error}</p>
                </div>
            )}
            
            {/* Metadata Bar */}
            <div className="p-2 flex items-center gap-6 text-sm">
                 <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold">{header.machineName || "Trace Viewer"}</span>
                </div>

                <div className="flex items-center gap-4 text-muted-foreground ml-auto">
                    {header.os && <span>{header.os}</span>}
                    {header.compiled && (
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{header.compiled}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <Cpu className="w-3 h-3" />
                        <span>{lines.length.toLocaleString()} lines</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

