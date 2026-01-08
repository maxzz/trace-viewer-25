import { cn } from "@/utils/index";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "../shadcn/dropdown-menu";

export function ColorPickerPopup({ color, onChange, children }: ColorPickerPopupProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {children}
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-auto p-2" align="start">
                <div className="grid grid-cols-4 gap-2">
                    {COLOR_GRID_Classes.map(
                        (c) => (
                            <ColorSwatch
                                key={c.key}
                                colorName={c.name}
                                bgClass={c.bgClass}
                                label={c.label}
                                letter={c.key}
                                isSelected={color === c.name}
                                onClick={() => onChange(c.name)}
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
    label: string;
    letter: string;
    isSelected: boolean;
    onClick: () => void;
}

function ColorSwatch({ colorName, bgClass, label, letter, isSelected, onClick }: ColorSwatchProps) {
    return (
        <button
            className={cn(
                "relative flex items-center justify-center size-8 rounded-md transition-all",
                "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isSelected && "ring-2 ring-primary ring-offset-2",
                !colorName && "bg-muted border border-border", // Transparent/None styling
            )}
            onClick={onClick}
            title={label}
        >
            <div className={cn(
                "size-full rounded-md",
                !colorName && "bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwYXRoIGQ9Ik0wIDBoNHY0SDB6bTQgNGg0djRINHoiIGZpbGw9IiNjY2MiIGZpbGwtb3BhY2l0eT0iLjQiLz48L3N2Zz4=')]", // Checkerboard for transparent
                colorName && bgClass
            )} />

            {/* Letter overlay */}
            <span className={cn(
                "absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold pointer-events-none opacity-50",
                colorName ? "text-white mix-blend-difference" : "text-muted-foreground"
            )}>
                {letter}
            </span>
        </button>
    );
}

interface ColorPickerPopupProps {
    color?: string; // Tailwind color class (e.g. "red-500") or undefined/null for transparent
    onChange: (color: string | undefined) => void;
    children: React.ReactNode;
}

// We store the color name (e.g. "red-500") as the value.
// We also store the full class name for the background to ensure Tailwind generates it.
const COLOR_GRID_Classes = [
    // Row 1
    { name: undefined,     /**/ label: "None",     /**/ key: "q", bgClass: "bg-transparent" },
    { name: "red-500",     /**/ label: "Red",    /**/ key: "w", bgClass: "bg-red-500" },
    { name: "orange-500",  /**/ label: "Orange", /**/ key: "e", bgClass: "bg-orange-500" },
    { name: "amber-500",   /**/ label: "Amber",    /**/ key: "r", bgClass: "bg-amber-500" },

    // Row 2
    { name: "yellow-500",  /**/ label: "Yellow", /**/ key: "t", bgClass: "bg-yellow-500" },
    { name: "green-500",   /**/ label: "Green",  /**/ key: "y", bgClass: "bg-green-500" },
    { name: "emerald-500", /**/ label: "Emerald",  /**/ key: "u", bgClass: "bg-emerald-500" },
    { name: "cyan-500",    /**/ label: "Cyan",   /**/ key: "i", bgClass: "bg-cyan-500" },

    // Row 3
    { name: "blue-500",    /**/ label: "Blue",   /**/ key: "o", bgClass: "bg-blue-500" },
    { name: "indigo-500",  /**/ label: "Indigo", /**/ key: "p", bgClass: "bg-indigo-500" },
    { name: "violet-500",  /**/ label: "Violet", /**/ key: "a", bgClass: "bg-violet-500" },
    { name: "purple-500",  /**/ label: "Purple", /**/ key: "s", bgClass: "bg-purple-500" },

    // Row 4
    { name: "pink-500",    /**/ label: "Pink", key: "d", bgClass: "bg-pink-500" },
];
