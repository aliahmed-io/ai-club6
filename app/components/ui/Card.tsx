import { ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const Card = ({
    children,
    className = "",
}: {
    children: ReactNode;
    className?: string;
}) => (
    <div
        className={cn(
            "bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-6",
            className
        )}
    >
        {children}
    </div>
);
