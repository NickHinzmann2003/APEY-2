import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { TrainingProvider } from "@/hooks/use-training";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import { Shell } from "@/components/layout/Shell";

import { Landing } from "@/pages/Landing";
import { PlansPage } from "@/pages/PlansPage";
import { ExercisesPage } from "@/pages/ExercisesPage";
import { ActiveTraining } from "@/pages/ActiveTraining";
import { Analytics } from "@/pages/Analytics";
import { Profile } from "@/pages/Profile";

function AuthenticatedApp() {
  return (
    <TrainingProvider>
      <Shell>
        <Switch>
          <Route path="/">
            <Redirect to="/plans" />
          </Route>
          <Route path="/plans" component={PlansPage} />
          <Route path="/exercises" component={ExercisesPage} />
          <Route path="/training" component={ActiveTraining} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/profile" component={Profile} />
          <Route component={NotFound} />
        </Switch>
      </Shell>
    </TrainingProvider>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    );
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
