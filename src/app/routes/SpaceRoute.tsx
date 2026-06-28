import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MoreHorizontal, Plus } from "lucide-react";

import { useAnchorStore } from "../useAnchorStore";
import { Button } from "../../components/ui/button";
import { EmptyState } from "../../components/ui/empty-state";
import { CardFormDialog } from "../../features/cards/CardFormDialog";
import { CardGrid } from "../../features/cards/CardGrid";
import { TransactionFormDialog } from "../../features/finance/TransactionFormDialog";
import { isFinanceSpace } from "../../features/spaces/defaultSpaces";
import { SpaceFormDialog } from "../../features/spaces/SpaceFormDialog";

export function SpaceRoute() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isSpaceDialogOpen, setIsSpaceDialogOpen] = useState(false);
  const [isAreaMenuOpen, setIsAreaMenuOpen] = useState(false);
  const { spaces, cards, removeSpace } = useAnchorStore();
  const space = spaces.find((item) => item.id === spaceId);
  const spaceCards = useMemo(
    () => cards.filter((card) => card.spaceId === spaceId),
    [cards, spaceId],
  );

  if (!spaceId || !space) {
    return <Navigate to="/" replace />;
  }

  const financeSpace = isFinanceSpace(space);

  function openPrimaryCreateAction() {
    if (financeSpace) {
      setIsTransactionDialogOpen(true);
      return;
    }

    setIsCardDialogOpen(true);
  }

  return (
    <div className="space-y-5">
      <button
        className="inline-flex items-center gap-2 rounded-full px-1 py-2 text-sm font-medium text-anchor-muted transition active:scale-95"
        onClick={() => navigate("/")}
        type="button"
      >
        <ArrowLeft className="h-4 w-4" />
        Today
      </button>

      <header className="liquid-panel p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="block h-3 w-3 rounded-full" style={{ backgroundColor: space.color }} />
            <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-anchor-text">{space.name}</h1>
            <p className="mt-1 line-clamp-2 max-w-2xl text-sm leading-6 text-anchor-muted">
              {space.description || "A private space for focused planning."}
            </p>
          </div>
          <div className="relative flex shrink-0 gap-2">
            <button
              aria-label={financeSpace ? "Add transaction" : "Add item"}
              className="liquid-icon-button h-10 w-10"
              onClick={openPrimaryCreateAction}
              type="button"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              aria-label="Area options"
              className="liquid-icon-button h-10 w-10"
              onClick={() => setIsAreaMenuOpen((isOpen) => !isOpen)}
              type="button"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {isAreaMenuOpen ? (
              <div className="absolute right-0 top-12 z-20 w-40 rounded-[22px] border border-white/55 bg-white/72 p-2 text-sm shadow-xl shadow-black/10 backdrop-blur-2xl">
                <button
                  className="w-full rounded-2xl px-3 py-2 text-left font-medium text-anchor-text"
                  onClick={() => {
                    setIsAreaMenuOpen(false);
                    setIsSpaceDialogOpen(true);
                  }}
                  type="button"
                >
                  Edit area
                </button>
                <button
                  className="w-full rounded-2xl px-3 py-2 text-left font-medium text-anchor-danger"
                  onClick={() => void removeSpace(space.id)}
                  type="button"
                >
                  Delete area
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {spaceCards.length > 0 ? (
        <CardGrid cards={spaceCards} spaceId={space.id} />
      ) : (
        <EmptyState
          title="No items here yet"
          description={
            financeSpace
              ? "Add a spent or credited transaction. The date starts as today."
              : "Add a goal, checklist, habit, progress tracker, or note to begin structuring this part of life."
          }
          action={
            <Button onClick={openPrimaryCreateAction}>
              <Plus className="h-4 w-4" />
              {financeSpace ? "Add transaction" : "Add first item"}
            </Button>
          }
        />
      )}

      <CardFormDialog open={isCardDialogOpen} onClose={() => setIsCardDialogOpen(false)} spaceId={space.id} />
      <TransactionFormDialog
        open={isTransactionDialogOpen}
        onClose={() => setIsTransactionDialogOpen(false)}
        spaceId={space.id}
      />
      <SpaceFormDialog open={isSpaceDialogOpen} onClose={() => setIsSpaceDialogOpen(false)} space={space} />
    </div>
  );
}
