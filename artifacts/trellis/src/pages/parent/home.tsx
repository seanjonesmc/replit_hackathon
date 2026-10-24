import { Screen } from '@/features/shell/layout';
import ParentHome from '@/features/parent/ParentHome';
import { getTab } from '@/lib/route-map';

export default function ParentHomePage() {
  return (
    <Screen tab={getTab('/parent/home')}>
      <ParentHome />
    </Screen>
  );
}
