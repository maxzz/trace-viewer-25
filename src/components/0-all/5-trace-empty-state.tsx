import { IconBinocular } from "../ui/icons";

export function TraceEmptyState() {
    return (
        <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center pointer-events-none">
            <IconBinocular className="size-8" />
            <p className="max-w-48 text-center text-sm text-foreground">
                Select or drag and drop a .trc3 to view traces.
            </p>
        </div>
    );
}

