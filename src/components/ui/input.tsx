import { type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

import { cn } from "../../shared/utils/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-[18px] border border-white/55 bg-white/46 px-4 py-2 text-sm text-anchor-text outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-xl transition placeholder:text-anchor-muted focus:border-anchor-accent/40 focus:ring-2 focus:ring-anchor-accent/10",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full resize-y rounded-[18px] border border-white/55 bg-white/46 px-4 py-3 text-sm text-anchor-text outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-xl transition placeholder:text-anchor-muted focus:border-anchor-accent/40 focus:ring-2 focus:ring-anchor-accent/10",
        className,
      )}
      {...props}
    />
  );
}
