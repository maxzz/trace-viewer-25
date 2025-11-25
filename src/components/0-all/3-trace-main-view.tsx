import { useSnapshot } from 'valtio';
import { traceStore } from '../../store/trace-store';
import { TraceList } from '../trace-viewer/2-trace-list';
import { FileText, Cpu, Clock } from 'lucide-react';

export function TraceMainView() {
    const { lines, header, error } = useSnapshot(traceStore);

    return (<>
        {/* Header Bar (Metadata) */}
        <div className="border-b p-4 flex items-center gap-6 bg-background">
            <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <h1 className="font-semibold">{header.machineName || "Trace Viewer"}</h1>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {header.os && <span>{header.os}</span>}
                {header.compiled && (
                    <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{header.compiled}</span>
                    </div>
                )}
                <div className="flex items-center gap-1">
                    <Cpu className="w-4 h-4" />
                    <span>{lines.length.toLocaleString()} lines</span>
                </div>
            </div>
        </div>

        {/* Error Banner */}
        {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                <p className="font-bold">Error loading trace</p>
                <p>{error}</p>
            </div>
        )}

        {/* Trace List */}
        <div className="flex-1 overflow-hidden">
            <TraceList />
        </div>
    </>);
}

//TODO: add footer instead of header bar (metadata) and show error message there as well
