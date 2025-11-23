import { TraceViewerApp } from "../trace-viewer/TraceViewerApp";

export function App() {
    return (
        <div className="h-screen w-screen overflow-hidden bg-background">
            <TraceViewerApp />
        </div>
    );
}
