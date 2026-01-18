import { useState } from "react";
import { cn } from "@/utils/index";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "../shadcn/dropdown-menu";

export function ColorPickerPopup({ color, onChange, children }: ColorPickerPopupProps) {
    const [open, setOpen] = useState(false);

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                {children}
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-auto p-2" align="start">
                <div className="grid grid-cols-4 gap-2">
                    {COLOR_GRID_Classes.map(
                        (c: HighlightRule, index: number) => (
                            <ColorSwatch
                                key={c.key}
                                colorName={c.name}
                                bgClass={c.bgClass}
                                textClass={c.textClass}
                                label={c.label}
                                letter={c.key}
                                isSelected={color === c.name}
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

interface ColorSwatchProps {
    colorName?: string;
    bgClass: string;
    textClass: string;
    label: string;
    letter: string;
    isSelected: boolean;
    onClick: () => void;
    index: number;
}

function ColorSwatch({ colorName, bgClass, textClass, label, letter, isSelected, onClick, index }: ColorSwatchProps) {
    return (
        <button className={cn(swatchClasses, isSelected && "ring ring-primary ring-offset-2", index === 0 && "col-span-full")} onClick={onClick} title={label}>
            {/* Background */}
            {colorName ? (
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

interface ColorPickerPopupProps {
    color?: string; // Tailwind color class (e.g. "red-500") or undefined/null for transparent
    onChange: (color: string | undefined) => void;
    children: React.ReactNode;
}

type HighlightRule = {
    name: string | undefined;
    label: string;
    key: string;
    bgClass: string;
    textClass: string;
};

// We store the color name (e.g. "red-500") as the value.
// We also store the full class name for the background to ensure Tailwind generates it.
const COLOR_GRID_Classes: ReadonlyArray<HighlightRule> = [
    // Row 1
    { name: undefined,     /**/ label: "None",     /**/ key: "q", bgClass: "bg-transparent", /**/ textClass: "text-foreground/50" },
    { name: "red-500",     /**/ label: "Red",    /**/ key: "w", bgClass: "bg-red-500",     /**/ textClass: "text-foreground/50" },
    { name: "orange-500",  /**/ label: "Orange", /**/ key: "e", bgClass: "bg-orange-500",  /**/ textClass: "text-foreground/50" },
    { name: "amber-500",   /**/ label: "Amber",    /**/ key: "r", bgClass: "bg-amber-500",   /**/ textClass: "text-foreground/50" },

    // Row 2
    { name: "yellow-300",  /**/ label: "Yellow", /**/ key: "t", bgClass: "bg-yellow-300",  /**/ textClass: "text-foreground/50" },
    { name: "green-500",   /**/ label: "Green",  /**/ key: "y", bgClass: "bg-green-500",   /**/ textClass: "text-foreground/50" },
    { name: "emerald-500", /**/ label: "Emerald",  /**/ key: "u", bgClass: "bg-emerald-500", /**/ textClass: "text-foreground/50" },
    { name: "cyan-500",    /**/ label: "Cyan",   /**/ key: "i", bgClass: "bg-cyan-500",    /**/ textClass: "text-foreground/50" },

    // Row 3
    { name: "blue-500",    /**/ label: "Blue",   /**/ key: "o", bgClass: "bg-blue-500",    /**/ textClass: "text-foreground/50" },
    { name: "indigo-500",  /**/ label: "Indigo", /**/ key: "p", bgClass: "bg-indigo-500",  /**/ textClass: "text-foreground/50" },
    { name: "violet-500",  /**/ label: "Violet", /**/ key: "a", bgClass: "bg-violet-500",  /**/ textClass: "text-foreground/50" },
    { name: "purple-500",  /**/ label: "Purple", /**/ key: "s", bgClass: "bg-purple-500",  /**/ textClass: "text-foreground/50" },

    // Row 4
    { name: "pink-500",    /**/ label: "Pink", key: "d", bgClass: "bg-pink-500", textClass: "text-foreground/50" },
];
