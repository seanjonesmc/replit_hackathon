import { Screen } from '@/features/shell/layout';
import ParentCardPolicy from '@/features/parent/ParentCardPolicy';
import { getTab } from '@/lib/route-map';

export default function ParentCardPage() {
  return (
    <Screen tab={getTab('/parent/card')}>
      <ParentCardPolicy />
    </Screen>
  );
}
