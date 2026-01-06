import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "../../store/1-ui-settings";
import { Button } from "../ui/shadcn/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/shadcn/dropdown-menu";
import { Filter, Check, FilterX, ChevronDown } from "lucide-react";
import { filterActions } from "../../store/4-file-filters";
import { dialogEditFiltersOpenAtom } from "../../store/2-ui-atoms";
import { useRef, useState } from "react";

export function FileFilterDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const setEditFiltersOpen = useSetAtom(dialogEditFiltersOpenAtom);
    const { fileFilters, selectedFilterId } = useSnapshot(appSettings);

    const lastActiveFilterIdRef = useRef<string | null>(null);
    if (selectedFilterId) {
        lastActiveFilterIdRef.current = selectedFilterId;
    }

    const activeFilter = fileFilters.find(filter => filter.id === selectedFilterId);

    function handleToggleFilter() {
        if (selectedFilterId) {
            filterActions.selectFilter(null);
        } else {
            // Try to restore last active filter
            const targetId = lastActiveFilterIdRef.current;
            const exists = targetId && fileFilters.find(filter => filter.id === targetId);

            if (exists) {
                filterActions.selectFilter(targetId);
            } else if (fileFilters.length > 0) {
                // Fallback to first available filter
                filterActions.selectFilter(fileFilters[0].id);
            }
        }
    }

    const showToggleButton = selectedFilterId || fileFilters.length > 0;

    return (
        <div className="flex items-center gap-1">
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <Button className="h-6 px-2 gap-1 rounded" variant="outline" size="sm">
                        <span className="max-w-[150px] truncate text-xs font-normal">
                            {activeFilter ? activeFilter.name : "All files"}
                        </span>
                        <ChevronDown className={`size-3 opacity-70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">

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

            {showToggleButton && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded"
                    onClick={handleToggleFilter}
                    title={selectedFilterId ? "Disable filter (Show all files)" : "Enable filter"}
                >
                    {selectedFilterId ? (
                        <FilterX className="size-3 opacity-70" />
                    ) : (
                        <Filter className="size-3 opacity-70" />
                    )}
                </Button>
            )}
        </div>
    );
}
