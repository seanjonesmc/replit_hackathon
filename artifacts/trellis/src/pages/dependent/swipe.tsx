import { Screen } from '@/features/shell/layout';
import SwipeSimulator from '@/features/dependent/SwipeSimulator';
import { getTab } from '@/lib/route-map';

export default function DependentSwipePage() {
  return (
    <Screen tab={getTab('/dependent/swipe')}>
      <SwipeSimulator />
    </Screen>
  );
}
