import { type ComponentType, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useListApprovals } from '@workspace/api-client-react';
import { AppShell } from '@/components/app-shell';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SessionProvider, useSession } from '@/features/shell/session';
import { SessionSplash, SignedOut } from '@/features/shell/SignedOut';
import { ALL_TABS, ROLES, SUB_SCREENS, firstTabPath, readLastRole, type ScreenPath } from '@/lib/route-map';
import NotFound from '@/pages/not-found';
import BrandPage from '@/pages/brand';
import ParentHomePage from '@/pages/parent/home';
import ParentAddMoneyPage from '@/pages/parent/add-money';
import ParentInsightsPage from '@/pages/parent/insights';
import ParentApprovalsPage from '@/pages/parent/approvals';
import ParentActivityPage from '@/pages/parent/activity';
import ParentCardPage from '@/pages/parent/card';
import ParentSettingsPage from '@/pages/parent/settings';
import FunderAddMoneyPage from '@/pages/funder/add-money';
import FunderWhereItWentPage from '@/pages/funder/where-it-went';
import DependentWalletPage from '@/pages/dependent/wallet';
import DependentSwipePage from '@/pages/dependent/swipe';
import {
  Redirect,
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

/** One page per tab and sub-screen in the route map; the type makes a missing page a compile error. */
const screens: Record<ScreenPath, ComponentType> = {
  '/parent/home': ParentHomePage,
  '/parent/add-money': ParentAddMoneyPage,
  '/parent/insights': ParentInsightsPage,
  '/parent/approvals': ParentApprovalsPage,
  '/parent/activity': ParentActivityPage,
  '/parent/card': ParentCardPage,
  '/parent/settings': ParentSettingsPage,
  '/funder/add-money': FunderAddMoneyPage,
  '/funder/where-it-went': FunderWhereItWentPage,
  '/dependent/wallet': DependentWalletPage,
  '/dependent/swipe': DependentSwipePage,
};

/** The root opens the last-used role (the parent by default). */
function OpenLastRole() {
  return <Redirect to={firstTabPath(readLastRole())} replace />;
}

function SignedInApp() {
  const approvals = useListApprovals();
  return (
    // The shell (role switcher, tab bar) stays outside the boundary so it
    // survives a screen crash.
    <AppShell badges={{ '/parent/approvals': approvals.data?.length ?? 0 }}>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={OpenLastRole} />
          {ROLES.map((role) => (
            <Route key={role.id} path={`/${role.id}`}>
              <Redirect to={firstTabPath(role.id)} replace />
            </Route>
          ))}
          {[...ALL_TABS, ...SUB_SCREENS].map((s) => (
            <Route key={s.path} path={s.path} component={screens[s.path]} />
          ))}
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </AppShell>
  );
}

/** Everything except the hidden brand preview requires a signed-in session. */
function SessionGate() {
  const { isLoading, isAuthenticated } = useSession();
  if (isLoading) return <SessionSplash />;
  if (!isAuthenticated) return <SignedOut />;
  return <SignedInApp />;
}

function Router() {
  return (
    <Switch>
      {/* Hidden brand preview: development only, outside sign-in, never in a tab bar. */}
      <Route path="/brand">
        <RoutedErrorBoundary>
          <BrandPage />
        </RoutedErrorBoundary>
      </Route>
      <Route>
        <SessionGate />
      </Route>
    </Switch>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SessionProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
        </SessionProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
