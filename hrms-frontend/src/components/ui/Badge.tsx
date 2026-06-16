import React from "react";
import { cn } from "@/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "destructive" | "success" | "warning" | "info";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-primary text-primary-foreground": variant === "default",
          "border-transparent bg-secondary text-secondary-foreground": variant === "secondary",
          "border-border text-foreground": variant === "outline",
          "border-transparent bg-destructive text-destructive-foreground": variant === "destructive",
          "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20": variant === "success",
          "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20": variant === "warning",
          "border-transparent bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20": variant === "info",
        },
        className
      )}
      {...props}
    />
  );
}
