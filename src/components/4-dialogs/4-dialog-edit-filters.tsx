import { useAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Reorder, useDragControls } from "motion/react";
import { Button } from "../ui/shadcn/button";
import { Input } from "../ui/shadcn/input";
import { Label } from "../ui/shadcn/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/shadcn/dialog";
import { GripVertical, Trash2, Plus } from "lucide-react";
import { appSettings, type FileFilter } from "../../store/1-ui-settings";
import { dialogEditFiltersOpenAtom } from "../../store/2-ui-atoms";
import { filterActions } from "../../store/4-file-filters";

export function DialogEditFilters() {
    const [open, setOpen] = useAtom(dialogEditFiltersOpenAtom);
    const { fileFilters } = useSnapshot(appSettings);

    const handleReorder = (newOrder: FileFilter[]) => {
        filterActions.reorderFilters(newOrder);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-[600px]!" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>
                        Filters
                    </DialogTitle>
                </DialogHeader>

                <div className="py-2">
                    <div className="flex items-center justify-between mb-4">
                        <Label>
                            Filters
                        </Label>
                        <Button variant="ghost" size="xs" onClick={() => filterActions.addFilter("Filter name", "")}>
                            <Plus className="size-3.5" />
                            Add Filter
                        </Button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                        <Reorder.Group className="list-none p-0 m-0" axis="y" values={fileFilters as unknown as FileFilter[]} onReorder={handleReorder}>
                            {fileFilters.map(
                                (filter) => (
                                    <FilterItem
                                        key={filter.id}
                                        filter={filter as unknown as FileFilter}
                                        onUpdate={filterActions.updateFilter}
                                        onDelete={filterActions.deleteFilter}
                                    />
                                )
                            )}
                        </Reorder.Group>

                        <Button variant="ghost" size="xs" onClick={() => filterActions.addFilter("Filter name", "")}>
                            <div className="text-center text-muted-foreground text-xs border border-dashed rounded-md">
                                Add Filter
                            </div>
                        </Button>
                    </div>

                    <div className="mt-4 text-xs text-muted-foreground">
                        <p>
                            Patterns support wildcards (e.g., <code>*.log</code>, <code>error*</code>).
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => setOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}

function FilterItem({ filter, onUpdate, onDelete }: { filter: FileFilter, onUpdate: (id: string, data: Partial<FileFilter>) => void, onDelete: (id: string) => void; }) {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            value={filter}
            id={filter.id}
            dragListener={false}
            dragControls={dragControls}
            className="mb-1 bg-background flex items-center gap-2"
        >
            <div className="cursor-grab touch-none p-2 hover:bg-muted rounded" onPointerDown={(e) => dragControls.start(e)}>
                <GripVertical className="size-4 text-muted-foreground" />
            </div>

            <div className="flex-1 grid grid-cols-2 gap-1">
                <Input
                    value={filter.name}
                    onChange={(e) => onUpdate(filter.id, { name: e.target.value })}
                    placeholder="Filter Name"
                    className="h-8"
                />
                <Input
                    value={filter.pattern}
                    onChange={(e) => onUpdate(filter.id, { pattern: e.target.value })}
                    placeholder="Pattern (e.g. *.log)"
                    className="h-8"
                />
            </div>

            <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground/50"
                onClick={() => onDelete(filter.id)}
            >
                <Trash2 className="" />
            </Button>
        </Reorder.Item>
    );
}
