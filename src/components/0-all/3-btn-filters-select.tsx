import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "../../store/1-ui-settings";
import { Button } from "../ui/shadcn/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/shadcn/dropdown-menu";
import { Filter, Check } from "lucide-react";
import { filterActions } from "../../store/4-file-filters";
import { dialogEditFiltersOpenAtom } from "../../store/2-ui-atoms";

export function FileFilterDropdown() {
    const { fileFilters, selectedFilterId } = useSnapshot(appSettings);
    const setEditFiltersOpen = useSetAtom(dialogEditFiltersOpenAtom);

    const activeFilter = fileFilters.find(f => f.id === selectedFilterId);
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className="h-6 px-2 gap-1 rounded" variant="ghost" size="sm">
                    <Filter className="size-3 opacity-70" />
                    <span className="max-w-[150px] truncate text-xs font-normal">
                        {activeFilter ? activeFilter.name : "All files"}
                    </span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start">

                <DropdownMenuItem onSelect={() => filterActions.selectFilter(null)}>
                    <span className={!selectedFilterId ? "font-medium" : ""}>
                        All files
                    </span>
                    {!selectedFilterId && <Check className="ml-auto size-4" />}
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                {fileFilters.map(
                    (filter) => (
                        <DropdownMenuItem key={filter.id} onSelect={() => filterActions.selectFilter(filter.id)}>
                            <span className={selectedFilterId === filter.id ? "font-medium" : ""}>
                                {filter.name}
                            </span>
                            {selectedFilterId === filter.id && <Check className="ml-auto size-4" />}
                        </DropdownMenuItem>
                    )
                )}

                {fileFilters.length > 0 && <DropdownMenuSeparator />}

                <DropdownMenuItem onSelect={() => setEditFiltersOpen(true)}>
                    Edit filters...
                </DropdownMenuItem>

            </DropdownMenuContent>
        </DropdownMenu>
    );
}
