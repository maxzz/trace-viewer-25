import { useAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Reorder, useDragControls } from "motion/react";
import { Button } from "../ui/shadcn/button";
import { Input } from "../ui/shadcn/input";
import { Label } from "../ui/shadcn/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/shadcn/dialog";
import { GripVertical, Trash2, Plus, Regex } from "lucide-react";
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
                    {/* <div className="flex items-center justify-between mb-4">
                        <Label className="text-xs font-normal">
                            Add or Edit Filters
                        </Label>
                    </div> */}

                    {/* Show header line for the filters list with column names located over the filter name and pattern columns */}
                    {fileFilters.length !== 0 && <Header />}

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

                        <Button className="mt-1 mx-5 h-7" variant="outline" size="xs" onClick={() => filterActions.addFilter("Filter name", "")}>
                            <Plus className="size-3.5" />
                            <div className="text-center text-muted-foreground text-xs border border-dashed rounded-md">
                                Add Filter
                            </div>
                        </Button>
                    </div>

                    <div className="mt-4 text-xs text-muted-foreground">
                        <p>
                            Patterns support wildcards (e.g., <code>*.log</code>, <code>error*</code>) or regex (use the regex button to enable).
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

function Header() {
    return (
        <div className="mt-4 px-5 grid grid-cols-2">
            <div className="text-xs font-semibold">
                Name
            </div>
            <div className="text-xs font-semibold">
                Pattern
            </div>
        </div>
    );
}

function FilterItem({ filter, onUpdate, onDelete }: { filter: FileFilter, onUpdate: (id: string, data: Partial<FileFilter>) => void, onDelete: (id: string) => void; }) {
    const dragControls = useDragControls();

    // Detect if pattern is regex (starts and ends with /)
    const isRegex = filter.pattern.startsWith('/') && filter.pattern.endsWith('/') && filter.pattern.length > 1;
    const patternWithoutSlashes = isRegex ? filter.pattern.slice(1, -1) : filter.pattern;

    const handlePatternChange = (value: string) => {
        // If currently regex, wrap the new value with slashes
        if (isRegex) {
            onUpdate(filter.id, { pattern: `/${value}/` });
        } else {
            onUpdate(filter.id, { pattern: value });
        }
    };

    const handleToggleRegex = () => {
        if (isRegex) {
            // Remove regex: unwrap slashes
            onUpdate(filter.id, { pattern: patternWithoutSlashes });
        } else {
            // Enable regex: wrap with slashes
            onUpdate(filter.id, { pattern: `/${filter.pattern}/` });
        }
    };

    return (
        <Reorder.Item
            className="mb-1 bg-background flex items-center"
            id={filter.id}
            value={filter}
            dragListener={false}
            dragControls={dragControls}
        >
            <div className="py-2 px-1 hover:bg-muted cursor-grab touch-none rounded" onPointerDown={(e) => dragControls.start(e)}>
                <GripVertical className="size-3 text-muted-foreground" />
            </div>

            <div className="flex-1 grid grid-cols-2 gap-1">
                <Input
                    className="h-8"
                    placeholder="Filter Name"
                    value={filter.name}
                    onChange={(e) => onUpdate(filter.id, { name: e.target.value })}
                    {...turnOffAutoComplete}
                />
                <div className="relative">
                    <Input
                        className="h-8 pr-8"
                        placeholder={isRegex ? "Regex pattern" : "Pattern (e.g. *.log)"}
                        value={patternWithoutSlashes}
                        onChange={(e) => handlePatternChange(e.target.value)}
                        {...turnOffAutoComplete}
                    />
                    <Button
                        className={`absolute right-0 top-0 h-8 w-8 rounded-l-none border-l-0 ${isRegex ? 'bg-primary/10 text-primary' : 'hover:bg-transparent'}`}
                        variant={isRegex ? "outline" : "ghost"}
                        size="icon-sm"
                        onClick={handleToggleRegex}
                        title={isRegex ? "Disable regex mode" : "Enable regex mode"}
                        type="button"
                    >
                        <Regex className="size-3.5" />
                    </Button>
                </div>
            </div>

            <Button className="size-7 text-muted-foreground/50" variant="ghost" size="icon-sm" onClick={() => onDelete(filter.id)}>
                <Trash2 className="size-3.5" />
            </Button>
        </Reorder.Item>
    );
}
