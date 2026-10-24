import { ComingSoonScreen } from '@/components/trellis/coming-soon-screen';
import { getTab } from '@/lib/route-map';

export default function ParentSettingsPage() {
  return <ComingSoonScreen tab={getTab('/parent/settings')} body={'Demo controls and how this maps to production will live here.'} />;
}
