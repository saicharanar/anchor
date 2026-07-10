import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import { useAnchorStore } from "../../app/useAnchorStore";

export function AppShell() {
  const { loadWorkspace, isLoading, error } = useAnchorStore();

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  return (
    <div className="daily-app">
      {error ? (
        <p className="daily-error" role="alert">
          {error}
        </p>
      ) : null}
      {isLoading ? <p className="daily-boot">Loading local workspace…</p> : <Outlet />}
    </div>
  );
}
