import { type ComponentType, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from '@/components/app-shell';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ALL_TABS, ROLES, firstTabPath, readLastRole, type TabPath } from '@/lib/route-map';
import NotFound from '@/pages/not-found';
import BrandPage from '@/pages/brand';
import ParentHomePage from '@/pages/parent/home';
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

const queryClient = new QueryClient();

/** One page per tab in the route map; the type makes a missing page a compile error. */
const screens: Record<TabPath, ComponentType> = {
  '/parent/home': ParentHomePage,
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

function Router() {
  return (
    // The shell (role switcher, tab bar) stays outside the boundary so it
    // survives a screen crash.
    <AppShell>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={OpenLastRole} />
          {/* Hidden brand preview: development only, never in a tab bar. */}
          <Route path="/brand" component={BrandPage} />
          {ROLES.map((role) => (
            <Route key={role.id} path={`/${role.id}`}>
              <Redirect to={firstTabPath(role.id)} replace />
            </Route>
          ))}
          {ALL_TABS.map((tab) => (
            <Route key={tab.path} path={tab.path} component={screens[tab.path]} />
          ))}
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </AppShell>
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
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
