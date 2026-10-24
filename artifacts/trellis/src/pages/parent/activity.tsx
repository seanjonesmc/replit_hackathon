import { Screen } from '@/features/shell/layout';
import ParentActivity from '@/features/parent/ParentActivity';
import { getTab } from '@/lib/route-map';

export default function ParentActivityPage() {
  return (
    <Screen tab={getTab('/parent/activity')}>
      <ParentActivity />
    </Screen>
  );
}
