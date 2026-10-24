import { SearchX } from 'lucide-react';
import { Link } from 'wouter';
import { EmptyState } from '@/components/trellis/empty-state';

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] w-full items-center justify-center bg-surface-alt px-6">
      <div className="w-full max-w-md rounded-card bg-surface">
        <EmptyState
          icon={SearchX}
          title="Page not found"
          titleAs="h1"
          body="There's nothing at this address."
          action={
            <Link href="/" className="type-link-sm text-primary hover:text-primary-hover hover:underline" data-testid="link-home">
              Go to the home screen
            </Link>
          }
          data-testid="page-not-found"
        />
      </div>
    </main>
  );
}
