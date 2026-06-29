import { useEffect, type ReactNode } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Grid2X2, Target } from "lucide-react";

import { useAnchorStore } from "../../app/useAnchorStore";
import { cn } from "../../shared/utils/cn";

export function AppShell() {
  const { loadWorkspace, isLoading, error } = useAnchorStore();
  const location = useLocation();
  const isItemDetailRoute = /\/spaces\/[^/]+\/items\/[^/]+/.test(location.pathname);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  return (
    <div className="min-h-svh bg-transparent text-anchor-text">
      <main className={cn("mx-auto w-full max-w-3xl px-4", isItemDetailRoute ? "pb-10 pt-3" : "pb-32 pt-6")}>
        {error ? (
          <div className="mb-5 rounded-[22px] border border-anchor-danger/20 bg-red-50/70 px-4 py-3 text-sm text-anchor-danger backdrop-blur-xl">
            {error}
          </div>
        ) : null}
        {isLoading ? <p className="text-sm text-anchor-muted">Loading local workspace...</p> : <Outlet />}
      </main>

      {isItemDetailRoute ? null : (
        <nav className="daily-bottom-nav fixed inset-x-0 bottom-4 z-40 mx-auto grid w-[min(88vw,420px)] grid-cols-2 gap-2 p-2">
          <BottomTab to="/" label="Tracker" icon={<Target className="h-5 w-5" />} />
          <BottomTab to="/dashboard" label="Dashboard" icon={<Grid2X2 className="h-5 w-5" />} />
        </nav>
      )}
    </div>
  );
}

type BottomTabProps = {
  to: string;
  icon: ReactNode;
  label: string;
};

function BottomTab({ to, icon, label }: BottomTabProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex h-14 flex-col items-center justify-center rounded-[24px] text-[12px] font-semibold transition",
          isActive ? "bg-white text-anchor-text shadow-sm shadow-black/8" : "text-anchor-muted",
        )
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
