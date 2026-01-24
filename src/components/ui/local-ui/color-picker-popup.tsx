import { type ReactNode, useState } from "react";
import { cn } from "@/utils/index";
import { Button } from "../shadcn/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "../shadcn/dropdown-menu";
import { type HighlightRule } from "@/store/1-ui-settings";
import { highlightActions } from "@/store/5-highlight-rules";

export function ColorPickerButton({ rule }: { rule: HighlightRule; }) {
    return (
        <ColorPickerPopup twColor={rule.twColor} onChange={(twColor) => highlightActions.updateRule(rule.id, { twColor })}>
            <Button className="size-8 p-0 overflow-hidden" variant="outline" title={rule.twColor ? `Color: ${rule.twColor}` : "Select color"}>
                <div className={cn("size-full opacity-20", rule.twColor && `bg-${rule.twColor}`)} />
            </Button>
        </ColorPickerPopup>
    );
}

function ColorPickerPopup({ twColor, onChange, children }: { twColor?: string; onChange: (twColor: string) => void; children: ReactNode; }) {
    const [open, setOpen] = useState(false);

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                {children}
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-auto p-2" align="start">
                <div className="grid grid-cols-4 gap-2">
                    {COLOR_GRID_Classes.map(
                        (c: HighlightRuleStatic, index: number) => (
                            <ColorSwatch
                                key={c.kbd}
                                bgClass={`bg-${c.name}`}
                                textClass={`text-foreground/50`}
                                label={c.label}
                                letter={c.kbd}
                                isSelected={twColor === c.name}
                                index={index}
                                onClick={() => {
                                    onChange(c.name);
                                    setOpen(false);
                                }}
                            />
                        )
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function ColorSwatch({ bgClass, textClass, label, letter, isSelected, onClick, index }: ColorSwatchProps) {
    return (
        <button
            className={cn(swatchClasses, isSelected && "ring ring-primary ring-offset-2 ring-offset-background", index === 1 && "col-span-3")}
            onClick={(e) => { e.currentTarget.blur(); setTimeout(() => onClick(), 50); }} // to avoid "Blocked aria-hidden on an element because its descendant retained focus."
            title={label}
        >
            {/* Background */}
            {label !== "None"
                ? (
                    <div className={cn("size-full opacity-20 rounded-md", bgClass)} />
                ) : (
                    <svg className="size-full fill-foreground/20 rounded-md">
                        <defs>
                            <pattern id="checkerboard-8x8" width="8" height="8" patternUnits="userSpaceOnUse">
                                <path d="M0 0h4v4H0zm4 4h4v4H4z" />
                            </pattern>
                        </defs>
                        <rect className="size-full" fill="url(#checkerboard-8x8)" />
                    </svg>
                )}

            {/* Letter overlay */}
            <span className={cn("absolute inset-0 px-1.5 py-1 text-[10px] font-mono pointer-events-none flex items-end justify-end", textClass)}>
                {letter}
            </span>
        </button>
    );
}

const swatchClasses = "\
relative \
size-8 \
border \
border-foreground/30 \
hover:scale-110 \
focus:outline-none \
focus:ring \
focus:ring-ring \
focus:ring-offset-2 \
rounded-md \
shadow \
dark:shadow-foreground/20 \
transition-all \
flex items-center justify-center";

interface ColorSwatchProps {
    bgClass: string;
    textClass: string;
    label: string;
    letter: string;
    isSelected: boolean;
    onClick: () => void;
    index: number;
}

// DpFbView
// DpAgentOtsPlugin
// (DpAgent|DpHost2)
// DpHost
// Altus
// mstsc

type HighlightRuleStatic = {
    name: string;
    label: string;
    kbd: string;
};

// We store the color name (e.g. "red-500") as the value.
// We also store the full class name for the background to ensure Tailwind generates it.
const COLOR_GRID_Classes: ReadonlyArray<HighlightRuleStatic> = [
    // Row 0
    { name: 'transparent', /**/ label: "None",     /**/ kbd: "q", },
    { name: "blue-500",    /**/ label: "Blue",   /**/ kbd: "o", },

    // Row 1
    { name: "green-500",   /**/ label: "Green",  /**/ kbd: "y", },
    { name: "emerald-500", /**/ label: "Emerald",  /**/ kbd: "u", },
    { name: "cyan-500",    /**/ label: "Cyan",   /**/ kbd: "i", },
    { name: "lime-500",    /**/ label: "Lime",   /**/ kbd: "f", },

    // Row 2
    { name: "indigo-500",  /**/ label: "Indigo", /**/ kbd: "p", },
    { name: "violet-500",  /**/ label: "Violet", /**/ kbd: "a", },
    { name: "purple-500",  /**/ label: "Purple", /**/ kbd: "s", },
    { name: "pink-500",    /**/ label: "Pink",   /**/ kbd: "d", },

    // Row 3
    { name: "red-500",     /**/ label: "Red",    /**/ kbd: "w", },
    { name: "orange-500",  /**/ label: "Orange", /**/ kbd: "e", },
    { name: "amber-500",   /**/ label: "Amber",    /**/ kbd: "r", },
    { name: "yellow-300",  /**/ label: "Yellow", /**/ kbd: "t", },

    // Row 4
    { name: "slate-700",   /**/ label: "Slate",    /**/ kbd: "g", },
    { name: "gray-500",    /**/ label: "Gray",   /**/ kbd: "h", },
    { name: "zinc-400",    /**/ label: "Zinc",     /**/ kbd: "j", },
    { name: "stone-200",   /**/ label: "Stone",    /**/ kbd: "k", },

    // Row 5
];
