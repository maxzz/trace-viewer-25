import { useAtom } from "jotai";
import { dialogEditFiltersOpenAtom } from "../../store/2-ui-atoms";
import { appSettings, type FileFilter } from "../../store/1-ui-settings";
import { filterActions } from "../../store/4-file-filters";
import { useSnapshot } from "valtio";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/shadcn/dialog";
import { Button } from "../ui/shadcn/button";
import { Input } from "../ui/shadcn/input";
import { Label } from "../ui/shadcn/label";
import { Reorder, useDragControls } from "motion/react";
import { GripVertical, Trash2, Plus } from "lucide-react";

function FilterItem({ filter, onUpdate, onDelete }: { filter: FileFilter, onUpdate: (id: string, data: Partial<FileFilter>) => void, onDelete: (id: string) => void }) {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            value={filter}
            id={filter.id}
            dragListener={false}
            dragControls={dragControls}
            className="flex items-center gap-2 mb-2 bg-background"
        >
            <div
                className="cursor-grab touch-none p-2 hover:bg-muted rounded"
                onPointerDown={(e) => dragControls.start(e)}
            >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="flex-1 grid grid-cols-2 gap-2">
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
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive/90"
                onClick={() => onDelete(filter.id)}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </Reorder.Item>
    );
}

export function DialogEditFilters() {
    const [open, setOpen] = useAtom(dialogEditFiltersOpenAtom);
    const { fileFilters } = useSnapshot(appSettings);

    const handleReorder = (newOrder: FileFilter[]) => {
        filterActions.reorderFilters(newOrder);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit Filters</DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <div className="flex items-center justify-between mb-4">
                        <Label>Filters</Label>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-1"
                            onClick={() => filterActions.addFilter("New Filter", "")}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add Filter
                        </Button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                         <Reorder.Group axis="y" values={fileFilters as unknown as FileFilter[]} onReorder={handleReorder} className="list-none p-0 m-0">
                            {fileFilters.map(filter => (
                                <FilterItem 
                                    key={filter.id} 
                                    filter={filter as unknown as FileFilter}
                                    onUpdate={filterActions.updateFilter}
                                    onDelete={filterActions.deleteFilter}
                                />
                            ))}
                        </Reorder.Group>
                        
                        {fileFilters.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-md">
                                No filters defined. Click "Add Filter" to create one.
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-4 text-xs text-muted-foreground">
                        <p>Patterns support wildcards (e.g., <code>*.log</code>, <code>error*</code>).</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => setOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
