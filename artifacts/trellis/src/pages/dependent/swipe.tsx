import { ComingSoonScreen } from '@/components/trellis/coming-soon-screen';
import { getTab } from '@/lib/route-map';

export default function DependentSwipePage() {
  return <ComingSoonScreen tab={getTab('/dependent/swipe')} body={'Trying out your card at sample shops will happen here.'} />;
}
