import type { ActivityItem } from '@workspace/api-client-react';
import { ActivityRow } from '@/components/trellis/activity-row';
import { chainStatusOf } from '@/lib/chain';
import { formatWhen } from '@/lib/format';
import { DECISION } from './spending';

/** One activity item from the API as a feed row. `compact` drops the reason and chain badge. */
export function FamilyActivityRow({ item, compact, now }: { item: ActivityItem; compact?: boolean; now?: Date }) {
  return (
    <ActivityRow
      who={item.actorName}
      sentence={item.summary}
      amountCents={item.direction === 'in' ? item.amountCents : -item.amountCents}
      status={item.decision ? DECISION[item.decision] : 'added'}
      detail={compact ? undefined : (item.detail ?? undefined)}
      when={formatWhen(item.occurredAt, now)}
      bucket={item.bucketName ?? undefined}
      steps={item.timeline}
      chain={compact ? undefined : chainStatusOf(item.chain)}
      data-testid={`row-activity-${item.id}`}
    />
  );
}
