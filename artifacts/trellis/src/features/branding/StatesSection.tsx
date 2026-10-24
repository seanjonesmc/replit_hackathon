import { Inbox, Plus } from 'lucide-react';
import { EmptyState } from '@/components/trellis/empty-state';
import { PillButton } from '@/components/trellis/primitives';
import {
  ActivityRowSkeleton,
  BucketCardSkeleton,
  HeroBalanceCardSkeleton,
  LoadingRegion,
} from '@/components/trellis/skeletons';
import { demo } from '@/lib/preview-data';
import { Panel, SampleLabel, usePreviewNotice } from './preview-kit';

/** Empty-state and loading-skeleton samples. */
export function StatesSection() {
  const [notify, notice] = usePreviewNotice();

  return (
    <Panel id="states" title="Empty & loading" note={<SampleLabel />}>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className="type-label text-ink-muted">Empty state</h3>
          <div className="rounded-card-sm border">
            <EmptyState
              icon={Inbox}
              title="No activity yet"
              body={`When ${demo.dependent} uses the card, purchases show up here.`}
              action={
                <PillButton variant="tint" size="sm" icon={<Plus className="size-4" aria-hidden="true" />} onClick={() => notify('Add money')} data-testid="button-empty-action">
                  Add money
                </PillButton>
              }
              data-testid="sample-empty-state"
            />
            <div className="px-6 pb-4">{notice}</div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="type-label text-ink-muted">Loading skeletons</h3>
          <LoadingRegion label="Loading sample" className="flex flex-col gap-4">
            <HeroBalanceCardSkeleton className="border" />
            <BucketCardSkeleton />
            <ul className="flex flex-col divide-y rounded-card-sm border px-5">
              <ActivityRowSkeleton />
              <ActivityRowSkeleton />
            </ul>
          </LoadingRegion>
        </div>
      </div>
    </Panel>
  );
}
