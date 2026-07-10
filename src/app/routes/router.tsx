import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "../../components/layout/app-shell";
import { AreasRoute } from "./AreasRoute";
import { CardDetailRoute } from "./CardDetailRoute";
import { DashboardRoute } from "./DashboardRoute";
import { MoneyRoute } from "./MoneyRoute";
import { SettingsRoute } from "./SettingsRoute";
import { SpaceRoute } from "./SpaceRoute";
import { SummaryRoute } from "./SummaryRoute";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

export const appRouter = createBrowserRouter(
  [
    {
      path: "/",
      element: <AppShell />,
      children: [
        { index: true, element: <DashboardRoute /> },
        { path: "dashboard", element: <SummaryRoute /> },
        { path: "areas", element: <AreasRoute /> },
        { path: "money", element: <MoneyRoute /> },
        { path: "spaces/:spaceId/items/:cardId", element: <CardDetailRoute /> },
        { path: "spaces/:spaceId", element: <SpaceRoute /> },
        { path: "settings", element: <SettingsRoute /> },
      ],
    },
  ],
  { basename },
);
