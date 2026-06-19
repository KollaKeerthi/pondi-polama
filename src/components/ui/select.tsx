import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-medium text-text outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15",
      className
    )}
    {...props}
  />
));
Select.displayName = "Select";
