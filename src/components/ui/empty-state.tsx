import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="liquid-panel flex min-h-52 flex-col items-center justify-center px-6 py-10 text-center">
      <h2 className="text-lg font-semibold text-anchor-text">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-anchor-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
