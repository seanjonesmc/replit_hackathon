import { BRAND } from '@brand/brand.config';
import { LogoMark } from '@/components/trellis/primitives';

/**
 * Holding screen at the root until the app shell lands.
 * Brand identity only: no sample data, no actions.
 */
export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-surface-alt">
      <main className="mx-auto flex min-h-[100dvh] max-w-phone flex-col bg-surface">
        <div className="header-sky h-56 shrink-0" aria-hidden="true" />
        <div className="-mt-12 flex flex-1 flex-col items-center px-6 pb-16 text-center">
          <LogoMark className="size-24 ring-4 ring-surface" />
          <h1 className="type-display-xl mt-6" data-testid="text-home-app-name">
            {BRAND.appName}
          </h1>
          <p className="type-body-lg mt-3 text-ink-muted" data-testid="text-home-tagline">
            {BRAND.tagline}
          </p>
        </div>
      </main>
    </div>
  );
}
