import { IconBinocular } from "../ui/icons";

export function TraceEmptyState() {
    return (
        <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center pointer-events-none">
            <IconBinocular className="size-8" />
            <p className="max-w-76 text-center text-sm text-foreground">
                Drag and drop the .trc3 file, folder, ZIP archive, or use the file selection dialog to view the traces.
            </p>
        </div>
    );
}
