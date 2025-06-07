import { Switch, Route, Router } from "wouter"; // ✅ Import Wouter's Router
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import SharedPostModal from "@/components/SharedPost"; // ✅ your shared post

// ✅ Renamed to avoid name conflict
function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/shared-post" component={SharedPostModal} />
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <Route path="/" component={Home} />
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          {/* ✅ Wrap with Wouter's Router to provide routing context */}
          <Router>
            <AppRoutes />
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
