import { lazy, Suspense } from 'react';
import PreviewUnavailable from '@/features/branding/PreviewUnavailable';
import { LoadingRegion, Skeleton } from '@/components/trellis/skeletons';

// `import.meta.env.DEV` is false in production builds, so this branch and the
// whole preview chunk (components samples and preview data) are dropped.
const BrandPreview = import.meta.env.DEV ? lazy(() => import('@/features/branding/BrandPreview')) : null;

/** Hidden /brand route. Not linked from any navigation. */
export default function BrandPage() {
  if (!BrandPreview) return <PreviewUnavailable />;
  return (
    <Suspense
      fallback={
        <LoadingRegion label="Loading preview" className="min-h-[100dvh] bg-surface-alt p-6">
          <Skeleton className="mx-auto h-48 max-w-6xl rounded-card bg-surface" />
        </LoadingRegion>
      }
    >
      <BrandPreview />
    </Suspense>
  );
}
