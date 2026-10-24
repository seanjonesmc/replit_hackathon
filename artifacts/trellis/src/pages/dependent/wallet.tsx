import { ComingSoonScreen } from '@/components/trellis/coming-soon-screen';
import { getTab } from '@/lib/route-map';

export default function DependentWalletPage() {
  return <ComingSoonScreen tab={getTab('/dependent/wallet')} body={"Your card and what's left in each bucket will show here."} />;
}
