import { BRAND } from '@brand/brand.config';
import { Wordmark } from '@/components/trellis/primitives';

export default function PreviewUnavailable() {
  return (
    <main className="flex min-h-[100dvh] w-full items-center justify-center bg-surface-alt px-6">
      <div className="max-w-md rounded-card bg-surface p-8 text-center">
        <div className="flex justify-center">
          <Wordmark />
        </div>
        <h1 className="type-title mt-6" data-testid="text-unavailable-title">Not available yet</h1>
        <p className="type-body-sm mt-2 text-ink-muted" data-testid="text-unavailable-body">
          {BRAND.appName} is still being built. There is nothing to sign in to or use here yet.
        </p>
      </div>
    </main>
  );
}
