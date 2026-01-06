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
import { turnOffAutoComplete } from "@/utils/disable-hidden-children";

export function DialogEditFilters() {
    const [open, setOpen] = useAtom(dialogEditFiltersOpenAtom);
    const { fileFilters } = useSnapshot(appSettings);

    const handleReorder = (newOrder: FileFilter[]) => {
        filterActions.reorderFilters(newOrder);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-[500px]!" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>
                        Filters
                    </DialogTitle>
                </DialogHeader>

                <div>
                    <div className="flex items-center justify-between mb-4">
                        <Label className="text-xs font-normal">
                            Add or Edit Filters
                        </Label>
                    </div>

                    {/* Show header line for the filters list with column names located over the filter name and pattern columns */}
                    {fileFilters.length !== 0 && (
                        <div className="mb-0.5 px-8 flex items-center justify-between">
                            <div className="px-1 flex-1 text-center">
                                <Label>
                                    Name
                                </Label>
                            </div>
                            <div className="flex-1 text-center">
                                <Label>
                                    Pattern
                                </Label>
                            </div>
                        </div>
                    )}

                    <div className="-mr-2 pr-2 py-1 max-h-[60vh] overflow-y-auto">
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

                        <Button className="mt-1 mx-8" variant="outline" size="xs" onClick={() => filterActions.addFilter("Filter name", "")}>
                            <Plus className="size-3.5" />
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

//TODO: no scroll
//TODO: delete confirmation

function FilterItem({ filter, onUpdate, onDelete }: { filter: FileFilter, onUpdate: (id: string, data: Partial<FileFilter>) => void, onDelete: (id: string) => void; }) {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            className="mb-1 bg-background flex items-center 1gap-2"
            id={filter.id}
            value={filter}
            dragListener={false}
            dragControls={dragControls}
        >
            <div className="cursor-grab touch-none p-2 hover:bg-muted rounded" onPointerDown={(e) => dragControls.start(e)}>
                <GripVertical className="size-4 text-muted-foreground" />
            </div>

            <div className="flex-1 grid grid-cols-2 gap-1">
                <Input
                    className="h-8"
                    placeholder="Filter Name"
                    value={filter.name}
                    onChange={(e) => onUpdate(filter.id, { name: e.target.value })}
                    {...turnOffAutoComplete}
                />
                <Input
                    className="h-8"
                    placeholder="Pattern (e.g. *.log)"
                    value={filter.pattern}
                    onChange={(e) => onUpdate(filter.id, { pattern: e.target.value })}
                    {...turnOffAutoComplete}
                />
            </div>

            <Button className="text-muted-foreground/50" variant="ghost" size="icon-sm" onClick={() => onDelete(filter.id)}>
                <Trash2 />
            </Button>
        </Reorder.Item>
    );
}
