import { proxy, useSnapshot } from 'valtio';
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "../ui/shadcn/input";

export function App() {
    const { text: snapText } = useSnapshot(trace);
    return (
        <div className="min-h-screen bg-background grid grid-rows-[auto_1fr_auto] place-items-center">
            <header className="size-full text-xl bg-muted">
                Trace Viewer
            </header>

            <main className="text-xs flex flex-col gap-4">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">

                        <label className="text-muted-foreground grid grid-flow-col items-center gap-2">
                            <span className="text-muted-foreground">Trace file:</span>
                            
                            <Input type="file" accept=".json" onChange={handleFileChange} className="text-xs 1hidden" />

                            {/* <input
                                type="file"
                                className="file-input file-input-bordered file-input-primary"
                                accept=".json"
                                onChange={handleFileChange}
                                placeholder=""
                            /> */}

                            <Button className="active:scale-x-[.97]">Load file</Button>
                            <Button variant="secondary">Clear</Button>
                        </label>

                        <label className="text-muted-foreground grid">
                            <span className="text-muted-foreground">
                                Trace
                            </span>
                            <textarea
                                className="bg-muted 1resize-none"
                                rows={10}
                                value={snapText}
                                onChange={(e) => handleTraceChange(e.target.value)}
                            />
                        </label>

                    </div>
                </div>
            </main>

            <footer className="absolute bottom-4 text-sm text-muted-foreground">
                <a
                    href="https://github.com/maxzz"
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4 hover:text-primary"
                >
                    by{' '}
                    Max Zakharzhevskiy
                </a>
            </footer>
        </div>
    );
}

const trace = proxy({ text: '' });

function handleFileChange() {
    console.log('handleFileChange');
}

function handleTraceChange(v: string) {
    trace.text = v;
}
