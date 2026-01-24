import { type ReactNode, useState } from "react";
import { cn } from "@/utils/index";
import { Button } from "../shadcn/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "../shadcn/dropdown-menu";
import { type HighlightRule } from "@/store/1-ui-settings";
import { highlightActions } from "@/store/5-highlight-rules";

export function ColorPickerButton({ rule }: { rule: HighlightRule; }) {
    const { overlayClasses } = rule;
    const title = getColorLabel(overlayClasses);
    return (
        <ColorPickerPopup twColor={overlayClasses} onChange={(twColor) => highlightActions.updateRule(rule.id, { overlayClasses: twColor })}>
            <Button className="p-0 size-8 overflow-hidden" variant="outline" title={title}>
                <div className={cn("size-full opacity-20", overlayClasses)} />
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
                                bgClass={`bg-${c.twColor}`} 
                                label={c.label}
                                letter={c.kbd}
                                isSelected={twColor === c.twColor}
                                index={index}
                                onClick={() => {
                                    onChange(c.twColor);
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

function ColorSwatch({ bgClass, label, letter, isSelected, onClick, index }: {
    bgClass: string;
    label: string;
    letter: string;
    isSelected: boolean;
    onClick: () => void;
    index: number;
}) {
    return (
        <button
            className={cn(swatchClasses, isSelected && "ring ring-primary ring-offset-2 ring-offset-background", index === 1 && "col-span-3")}
            onClick={(e) => { e.currentTarget.blur(); setTimeout(() => onClick(), 50); }} // to avoid "Blocked aria-hidden on an element because its descendant retained focus."
            title={label}
        >
            {/* Background */}
            {label !== "key-None"
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
            <span className={cn("absolute inset-0 px-1.5 py-1 text-[10px] font-mono text-foreground/50 pointer-events-none flex items-end justify-end")}>
                {letter}
            </span>
        </button>
    );
}

const COLOR_GRID_Classes: HighlightRuleStatic[] = [
    { label: "key-None",      /**/ twColor: 'bg-transparent', /**/ kbd: "q", },
    { label: "key-Blue",      /**/ twColor: "bg-blue-500",    /**/ kbd: "o", },

    { label: "key-Green",     /**/ twColor: "bg-green-500",   /**/ kbd: "y", },
    { label: "key-Emerald",   /**/ twColor: "bg-emerald-500", /**/ kbd: "u", },
    { label: "key-Cyan",      /**/ twColor: "bg-cyan-500",    /**/ kbd: "i", },
    { label: "key-Lime",      /**/ twColor: "bg-lime-500",    /**/ kbd: "f", },

    { label: "key-Indigo",    /**/ twColor: "bg-indigo-500",  /**/ kbd: "p", },
    { label: "key-Violet",    /**/ twColor: "bg-violet-500",  /**/ kbd: "a", },
    { label: "key-Purple",    /**/ twColor: "bg-purple-500",  /**/ kbd: "s", },
    { label: "key-Pink",      /**/ twColor: "bg-pink-500",    /**/ kbd: "d", },

    { label: "key-Red",       /**/ twColor: "bg-red-500",     /**/ kbd: "w", },
    { label: "key-Orange",    /**/ twColor: "bg-orange-500",  /**/ kbd: "e", },
    { label: "key-Amber",     /**/ twColor: "bg-amber-500",   /**/ kbd: "r", },
    { label: "key-Yellow",    /**/ twColor: "bg-yellow-300",  /**/ kbd: "t", },

    { label: "key-Slate",     /**/ twColor: "bg-slate-700",   /**/ kbd: "g", },
    { label: "key-Gray",      /**/ twColor: "bg-gray-500",    /**/ kbd: "h", },
    { label: "key-Zinc",      /**/ twColor: "bg-zinc-400",    /**/ kbd: "j", },
    { label: "key-Stone",     /**/ twColor: "bg-stone-200",   /**/ kbd: "k", },
] as const;

type HighlightRuleStatic = {
    twColor: string;
    label: string;
    kbd: string;
};

function getColorLabel(label: string): string {
    return label.replace("key-", "");
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

// DpFbView
// DpAgentOtsPlugin
// (DpAgent|DpHost2)
// DpHost
// Altus
// mstsc
