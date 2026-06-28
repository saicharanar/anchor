import { RouterProvider } from "react-router-dom";

import { appRouter } from "./app/routes/router";

export default function App() {
  return <RouterProvider router={appRouter} />;
}
