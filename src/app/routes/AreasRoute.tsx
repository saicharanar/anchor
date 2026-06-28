import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Plus } from "lucide-react";

import { useAnchorStore } from "../useAnchorStore";
import { Progress } from "../../components/ui/progress";
import { SpaceFormDialog } from "../../features/spaces/SpaceFormDialog";
import { getDashboardSummary } from "../../features/dashboard/dashboardSelectors";

export function AreasRoute() {
  const [isCreatingArea, setIsCreatingArea] = useState(false);
  const { spaces, cards } = useAnchorStore();
  const summary = getDashboardSummary(spaces, cards);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3 px-1 pt-1">
        <div>
          <p className="text-[13px] font-medium text-anchor-muted">Your life sections</p>
          <h1 className="mt-1 text-[34px] font-semibold tracking-tight text-anchor-text">Areas</h1>
        </div>
        <button
          aria-label="Add area"
          className="liquid-icon-button"
          onClick={() => setIsCreatingArea(true)}
          type="button"
        >
          <Plus className="h-5 w-5" />
        </button>
      </header>

      <section className="liquid-panel overflow-hidden">
        <div className="divide-y divide-white/55">
          {summary.progressBySpace.map((item) => (
            <Link key={item.space.id} to={`/spaces/${item.space.id}`} className="block px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.space.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[17px] font-semibold text-anchor-text">{item.space.name}</span>
                  <span className="block truncate text-sm text-anchor-muted">
                    {item.itemCount === 1 ? "1 item" : `${item.itemCount} items`}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-anchor-muted/70" />
              </div>
              {item.progress > 0 ? (
                <div className="mt-3 flex items-center gap-3 pl-6">
                  <Progress value={item.progress} />
                  <span className="w-9 text-right text-xs text-anchor-muted">{item.progress}%</span>
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      </section>

      <SpaceFormDialog open={isCreatingArea} onClose={() => setIsCreatingArea(false)} />
    </div>
  );
}
