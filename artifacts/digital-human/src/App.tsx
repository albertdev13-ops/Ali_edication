import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { useEffect } from 'react';
import { useLocation } from 'wouter';

import { Shell } from '@/components/layout/Shell';
import { PwaPrompt } from '@/components/PwaPrompt';
import NotFound from '@/pages/not-found';
import { loadLocalState } from '@/lib/local-db';

import ChatPage from '@/pages/chat';
import MemoryPage from '@/pages/memory';
import FilesPage from '@/pages/files';
import GithubPage from '@/pages/github';
import VercelPage from '@/pages/vercel';
import SettingsPage from '@/pages/settings';
import OnboardingPage from '@/pages/onboarding';
import DashboardPage from '@/pages/dashboard';
import ProfSetupPage from '@/pages/prof-setup';
import ProgressionPage from '@/pages/progression';
import PotePage from '@/pages/pote';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function FirstRunRedirect() {
  const [location, setLocation] = useLocation();
  useEffect(() => {
    const isAliProtectedRoute = ['/', '/dashboard', '/prof-setup', '/progression', '/pote'].includes(location);
    if (!isAliProtectedRoute || location === '/onboarding') return;

    let active = true;
    try {
      if (sessionStorage.getItem('ali-onboarding-complete') === '1') return;
    } catch {
      // Continue with the IndexedDB check when sessionStorage is unavailable.
    }
    void loadLocalState().then(({ appState }) => {
      if (active && !appState.firstRunCompleted) setLocation('/onboarding');
    });

    return () => {
      active = false;
    };
  }, [location, setLocation]);
  return null;
}

function Router() {
  return (
    <Shell>
      <FirstRunRedirect />
      <Switch>
        <Route path="/" component={ChatPage} />
        <Route path="/onboarding" component={OnboardingPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/prof-setup" component={ProfSetupPage} />
        <Route path="/progression" component={ProgressionPage} />
        <Route path="/pote" component={PotePage} />
        <Route path="/memory" component={MemoryPage} />
        <Route path="/files" component={FilesPage} />
        <Route path="/github" component={GithubPage} />
        <Route path="/vercel" component={VercelPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
          <PwaPrompt />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;