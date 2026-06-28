import { cn } from "../../shared/utils/cn";

type ProgressProps = {
  value: number;
  className?: string;
};

export function Progress({ value, className }: ProgressProps) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-black/8", className)}>
      <div
        className="h-full rounded-full bg-anchor-text/80 transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
