import { lazy, Suspense, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import PreviewUnavailable from '@/features/branding/PreviewUnavailable';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

const BrandPreview = import.meta.env.DEV
  ? lazy(() => import('@/features/branding/BrandPreview'))
  : null;

function Home() {
  if (!BrandPreview) return <PreviewUnavailable />;
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] bg-surface-alt p-6" aria-busy="true" aria-label="Loading preview">
          <div className="mx-auto h-48 max-w-6xl animate-pulse rounded-card bg-surface" />
        </div>
      }
    >
      <BrandPreview />
    </Suspense>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
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
