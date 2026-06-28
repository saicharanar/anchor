import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { Button } from "./button";

type DialogProps = {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function Dialog({ title, description, open, onClose, children }: DialogProps) {
  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/28 px-3 py-3 backdrop-blur-md sm:items-center sm:py-8">
      <section className="max-h-[88svh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-white/75 bg-anchor-sheet p-5 shadow-2xl shadow-black/18">
        <header className="sticky top-0 z-10 -mx-5 -mt-5 flex items-start justify-between gap-4 border-b border-black/8 bg-anchor-sheet/95 px-5 pb-4 pt-5 backdrop-blur-xl">
          <div>
            <h2 className="text-xl font-semibold text-anchor-text">{title}</h2>
            {description ? <p className="mt-1 text-sm text-anchor-muted">{description}</p> : null}
          </div>
          <Button aria-label="Close dialog" className="h-9 w-9 border-black/5 bg-black/5 px-0" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </header>
        <div className="pt-5">{children}</div>
      </section>
    </div>,
    document.body,
  );
}
