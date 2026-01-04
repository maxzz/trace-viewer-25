import { ButtonThemeToggle } from "./3-btn-theme-toggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/shadcn/dropdown-menu";
import { useSnapshot } from "valtio";
import { appSettings } from "../../store/ui-settings";
import { filterActions } from "../../store/file-filters";
import { useSetAtom } from "jotai";
import { dialogEditFiltersOpenAtom } from "../../store/ui-atoms";
import { Filter, Check } from "lucide-react";
import { Button } from "../ui/shadcn/button";

// File Filter Dropdown

export function FileFilterDropdown() {
    const { fileFilters, selectedFilterId } = useSnapshot(appSettings);
    const setEditFiltersOpen = useSetAtom(dialogEditFiltersOpenAtom);

    const activeFilter = fileFilters.find(f => f.id === selectedFilterId);
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
                    <Filter className="h-4 w-4 opacity-70" />
                    <span className="max-w-[150px] truncate text-xs font-normal">
                        {activeFilter ? activeFilter.name : "Show all files"}
                    </span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start">
                <DropdownMenuItem onSelect={() => filterActions.selectFilter(null)}>
                    <span className={!selectedFilterId ? "font-medium" : ""}>Show all files</span>
                    {!selectedFilterId && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {fileFilters.map(filter => (
                    <DropdownMenuItem key={filter.id} onSelect={() => filterActions.selectFilter(filter.id)}>
                       <span className={selectedFilterId === filter.id ? "font-medium" : ""}>{filter.name}</span>
                       {selectedFilterId === filter.id && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                ))}
                 {fileFilters.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem onSelect={() => setEditFiltersOpen(true)}>
                    Edit filters...
                </DropdownMenuItem>
            </DropdownMenuContent>
            
        </DropdownMenu>
    );
}
