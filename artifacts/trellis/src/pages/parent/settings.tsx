import { Screen } from '@/features/shell/layout';
import ParentSettings from '@/features/parent/ParentSettings';
import { getTab } from '@/lib/route-map';

export default function ParentSettingsPage() {
  return (
    <Screen tab={getTab('/parent/settings')}>
      <ParentSettings />
    </Screen>
  );
}
