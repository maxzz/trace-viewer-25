import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { useSnapshot } from "valtio";
import { Reorder, useDragControls } from "motion/react";
import { Button } from "../ui/shadcn/button";
import { Input } from "../ui/shadcn/input";
import { Checkbox } from "../ui/shadcn/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/shadcn/dialog";
import { GripVertical, Trash2, Plus, Regex } from "lucide-react";
import { appSettings, type HighlightRule } from "../../store/1-ui-settings";
import { dialogEditHighlightsOpenAtom } from "../../store/2-ui-atoms";
import { highlightActions } from "../../store/5-highlight-rules";
import { turnOffAutoComplete } from "@/utils/disable-hidden-children";
import { notice } from "../ui/local-ui/7-toaster/7-toaster";
import { ColorPickerPopup } from "../ui/local-ui/color-picker-popup";
import { cn } from "@/utils/index";

export function DialogEditHighlightRules() {
    const [open, setOpen] = useAtom(dialogEditHighlightsOpenAtom);
    const { highlightRules } = useSnapshot(appSettings, { sync: true });
    const [invalidRuleIds, setInvalidRuleIds] = useState<{ name: Set<string>, pattern: Set<string>; }>({ name: new Set(), pattern: new Set() });

    function handleReorder(newOrder: HighlightRule[]) {
        highlightActions.reorderRules(newOrder);
    }

    function validateRules(): boolean {
        const invalidNames = new Set<string>();
        const invalidPatterns = new Set<string>();

        highlightRules.forEach(
            (rule) => {
                if (!rule.name || rule.name.trim() === '') {
                    invalidNames.add(rule.id);
                }
                if (!rule.pattern || rule.pattern.trim() === '') {
                    invalidPatterns.add(rule.id);
                }
            }
        );

        setInvalidRuleIds({ name: invalidNames, pattern: invalidPatterns });

        if (invalidNames.size > 0 || invalidPatterns.size > 0) {
            notice.error('Highlight name and pattern cannot be empty');
            return false;
        }

        return true;
    }

    function handleOpenChange(newOpen: boolean) {
        if (newOpen) {
            setInvalidRuleIds({ name: new Set(), pattern: new Set() });
            setOpen(true);
        } else {
            if (validateRules()) {
                setOpen(false);
            }
        }
    }

    function handleClose() {
        if (validateRules()) {
            setOpen(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-[500px]!" aria-describedby={undefined} onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="select-none">
                        Highlights
                    </DialogTitle>
                </DialogHeader>

                <div>
                    {highlightRules.length !== 0 && <Header />}

                    <div className="-mr-2 pr-2 py-1 max-h-[60vh] overflow-y-auto">
                        <Reorder.Group className="m-0 p-0" axis="y" values={highlightRules as unknown as HighlightRule[]} onReorder={handleReorder}>
                            {highlightRules.map(
                                (rule) => (
                                    <HighlightRow
                                        key={rule.id}
                                        rule={rule as unknown as HighlightRule}
                                        onDelete={highlightActions.deleteRule}
                                        isNameInvalid={invalidRuleIds.name.has(rule.id)}
                                        isPatternInvalid={invalidRuleIds.pattern.has(rule.id)}
                                    />
                                )
                            )}
                        </Reorder.Group>

                        <Button className="mt-1 mx-5 h-7" variant="outline" size="xs" onClick={() => highlightActions.addRule("", "")}>
                            <Plus className="size-3.5" />
                            Add Highlight Rule
                        </Button>
                    </div>

                    <div className="mx-5 mt-1 mb-1 text-xs text-muted-foreground text-balance">
                        <p className="mb-1">
                            Patterns support wildcards or regex. First matching rule determines color.
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>
                                <span className={codeClasses}>*Error*</span> wildcard to color files with name containing Error
                            </li>
                            <li>
                                <span className={codeClasses}>/Log$/</span> regex to color files ending in Log
                            </li>
                        </ul>
                    </div>
                </div>

                <DialogFooter className="justify-center!">
                    <Button variant="outline" onClick={handleClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}

const codeClasses = "px-1 bg-muted outline rounded";

function Header() {
    return (
        <div className="mt-4 pl-16 pr-5 grid grid-cols-[1fr_1fr_52px] gap-1 select-none">
            <div className="text-xs font-semibold">
                Name
            </div>
            <div className="text-xs font-semibold">
                Pattern
            </div>
            <div className="text-xs font-semibold text-center">
                Color
            </div>
        </div>
    );
}

function HighlightRow({ rule, onDelete, isNameInvalid, isPatternInvalid }: { rule: HighlightRule, onDelete: (id: string) => void, isNameInvalid?: boolean, isPatternInvalid?: boolean; }) {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            className="mb-1 bg-background flex items-center select-none"
            id={rule.id}
            value={rule}
            dragListener={false}
            dragControls={dragControls}
        >
            <div className="py-2 px-1 hover:bg-muted cursor-grab touch-none rounded" onPointerDown={(e) => dragControls.start(e)}>
                <GripVertical className="size-3 text-muted-foreground" />
            </div>

            <Checkbox
                className="mr-2"
                checked={rule.enabled !== false}
                onCheckedChange={(checked) => highlightActions.updateRule(rule.id, { enabled: !!checked })}
            />

            <div className="flex-1 grid grid-cols-[1fr_1fr_36px] gap-1">
                {/* Name */}
                <Input
                    className={`h-8 ${isNameInvalid ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    placeholder="Highlight Name"
                    value={rule.name}
                    onChange={(e) => highlightActions.updateRule(rule.id, { name: e.target.value })}
                    {...turnOffAutoComplete}
                />
                {/* Pattern */}
                <InputPattern
                    ruleId={rule.id}
                    pattern={rule.pattern}
                    isPatternInvalid={isPatternInvalid ?? false}
                />
                {/* Color */}
                <div className="flex justify-center items-center">
                    <ColorPickerPopup color={rule.color} onChange={(color) => highlightActions.updateRule(rule.id, { color })}>
                        <Button
                            variant="outline"
                            className="size-8 p-0 overflow-hidden"
                            title={rule.color ? `Color: ${rule.color}` : "Select color"}
                        >
                            <div className={cn(
                                "size-full",
                                !rule.color && "bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwYXRoIGQ9Ik0wIDBoNHY0SDB6bTQgNGg0djRINHoiIGZpbGw9IiNjY2MiIGZpbGwtb3BhY2l0eT0iLjQiLz48L3N2Zz4=')]", // Checkerboard for transparent
                                rule.color && `bg-${rule.color}`
                            )} />
                        </Button>
                    </ColorPickerPopup>
                </div>
            </div>

            <Button className="ml-0.5 size-7 text-muted-foreground/50 rounded" variant="ghost" size="icon-sm" tabIndex={-1} onClick={() => onDelete(rule.id)}>
                <Trash2 className="size-3.5" />
            </Button>
        </Reorder.Item>
    );
}

function InputPattern({ ruleId, pattern, isPatternInvalid }: { ruleId: string, pattern: string, isPatternInvalid: boolean; }) {
    const isRegex = pattern.startsWith('/') && pattern.endsWith('/') && pattern.length > 1;
    const patternWithoutSlashes = isRegex ? pattern.slice(1, -1) : pattern;

    const [localValue, setLocalValue] = useState(patternWithoutSlashes);

    useEffect(() => setLocalValue(patternWithoutSlashes), [patternWithoutSlashes]);

    function onUpdate(id: string, data: Partial<HighlightRule>) {
        highlightActions.updateRule(id, data);
    }

    function handlePatternChange(value: string) {
        setLocalValue(value);
        if (isRegex) {
            onUpdate(ruleId, { pattern: `/${value}/` });
        } else {
            onUpdate(ruleId, { pattern: value });
        }
    }

    function handleToggleRegex() {
        if (isRegex) {
            onUpdate(ruleId, { pattern: patternWithoutSlashes });
        } else {
            onUpdate(ruleId, { pattern: `/${pattern}/` });
        }
    }

    return (
        <div className="relative">
            <Input
                className={`h-8 pr-8 ${isPatternInvalid ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                placeholder={isRegex ? "Regex pattern" : "Pattern (e.g. *.log)"}
                value={localValue}
                onChange={(e) => handlePatternChange(e.target.value)}
                {...turnOffAutoComplete}
            />
            <div className="absolute right-0 top-0">
                <Button
                    className={`border-0 border-l border-l-border rounded-r-[3px] rounded-l-none ${isRegex ? 'text-primary bg-primary/10' : 'hover:bg-primary/5'} ${isPatternInvalid ? 'border-l-red-500' : ''}`}
                    variant={isRegex ? "outline" : "ghost"}
                    size="icon-sm"
                    onClick={handleToggleRegex}
                    title="Use regex pattern"
                    type="button"
                    tabIndex={-1}
                >
                    <Regex className={`size-3 ${isRegex ? 'text-primary' : 'text-muted-foreground/50'}`} />
                </Button>
            </div>
        </div>
    );
}
