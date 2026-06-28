import { useEffect, type ReactNode } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Grid2X2, Home, Settings, WalletCards } from "lucide-react";

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
      {isItemDetailRoute ? null : (
        <header className="sticky top-0 z-30 px-4 pt-3">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
            <NavLink to="/" className="text-[15px] font-semibold tracking-tight text-anchor-text/80">
              Anchor
            </NavLink>
            <NavLink
              aria-label="Settings"
              to="/settings"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/30 text-anchor-muted ring-1 ring-white/45 backdrop-blur-2xl transition active:scale-95"
            >
              <Settings className="h-4 w-4" />
            </NavLink>
          </div>
        </header>
      )}

      <main className={cn("mx-auto w-full max-w-3xl px-4", isItemDetailRoute ? "pb-10 pt-3" : "pb-40 pt-4")}>
        {error ? (
          <div className="mb-5 rounded-[22px] border border-anchor-danger/20 bg-red-50/70 px-4 py-3 text-sm text-anchor-danger backdrop-blur-xl">
            {error}
          </div>
        ) : null}
        {isLoading ? <p className="text-sm text-anchor-muted">Loading local workspace...</p> : <Outlet />}
      </main>

      {isItemDetailRoute ? null : (
        <nav className="liquid-nav fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[min(88vw,360px)] items-center justify-between px-2 py-2">
          <BottomTab to="/" label="Today" icon={<Home className="h-5 w-5" />} />
          <BottomTab to="/areas" label="Areas" icon={<Grid2X2 className="h-5 w-5" />} />
          <BottomTab to="/money" label="Money" icon={<WalletCards className="h-5 w-5" />} />
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
          "flex h-12 min-w-20 flex-col items-center justify-center rounded-full text-[11px] font-medium transition",
          isActive ? "bg-white/82 text-anchor-text shadow-sm shadow-black/8" : "text-anchor-muted",
        )
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
