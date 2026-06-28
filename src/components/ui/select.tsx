import { type SelectHTMLAttributes } from "react";

import { cn } from "../../shared/utils/cn";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-11 w-full rounded-[18px] border border-white/55 bg-white/46 px-4 py-2 text-sm text-anchor-text outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-xl transition focus:border-anchor-accent/40 focus:ring-2 focus:ring-anchor-accent/10",
        className,
      )}
      {...props}
    />
  );
}
