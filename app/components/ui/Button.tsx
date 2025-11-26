import { ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps {
    children: ReactNode;
    onClick?: () => void;
    variant?: "primary" | "secondary" | "outline" | "ghost";
    disabled?: boolean;
    className?: string;
    type?: "button" | "submit" | "reset";
}

export const Button = ({
    children,
    onClick,
    variant = "primary",
    disabled = false,
    className = "",
    type = "button",
}: ButtonProps) => {
    const baseStyle =
        "px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation";
    const variants = {
        primary:
            "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40",
        secondary:
            "bg-white/70 text-slate-700 hover:bg-white border border-white/60 shadow-md",
        outline: "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50",
        ghost: "text-slate-500 hover:bg-slate-100/50",
    };
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                baseStyle,
                variants[variant],
                disabled ? "opacity-50 cursor-not-allowed" : "",
                className
            )}
        >
            {children}
        </button>
    );
};
