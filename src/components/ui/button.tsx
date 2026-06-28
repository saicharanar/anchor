import { type ButtonHTMLAttributes } from "react";

import { cn } from "../../shared/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClassNames: Record<ButtonVariant, string> = {
  primary: "border-anchor-accent bg-anchor-accent text-white hover:bg-anchor-accent-strong",
  secondary: "border-white/55 bg-white/50 text-anchor-text backdrop-blur-xl hover:bg-white/70",
  ghost: "border-transparent bg-transparent text-anchor-muted hover:bg-white/35 hover:text-anchor-text",
  danger: "border-anchor-danger bg-anchor-danger text-white hover:bg-red-900",
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anchor-accent disabled:cursor-not-allowed disabled:opacity-50",
        variantClassNames[variant],
        className,
      )}
      {...props}
    />
  );
}
