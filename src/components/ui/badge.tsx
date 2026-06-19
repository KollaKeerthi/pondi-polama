import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-primary text-white",
  secondary: "bg-secondary/12 text-secondary",
  accent: "bg-accent/14 text-accent",
  highlight: "bg-highlight/12 text-highlight",
  outline: "border border-border bg-white text-primary"
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold", variants[variant], className)}
      {...props}
    />
  );
}
