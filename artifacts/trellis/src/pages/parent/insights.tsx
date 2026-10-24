import { Screen } from '@/features/shell/layout';
import ParentInsights from '@/features/insights/ParentInsights';
import { getSubScreen } from '@/lib/route-map';

export default function ParentInsightsPage() {
  return (
    <Screen tab={getSubScreen('/parent/insights')}>
      <ParentInsights />
    </Screen>
  );
}
