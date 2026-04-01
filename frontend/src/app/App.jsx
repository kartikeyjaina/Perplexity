import { useEffect } from "react";
import { RouterProvider } from "react-router";

import { router } from "./app.routes";
import { useAuth } from "../features/auth/hooks/useAuth";

function App() {
  const { handleGetMe } = useAuth();
  //check if user is logged in on app load
  useEffect(() => {
    handleGetMe();
  }, [handleGetMe]);

  // Render the router
  return <RouterProvider router={router} />;
}

export default App;
