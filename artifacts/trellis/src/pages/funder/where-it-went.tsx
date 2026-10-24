import { ComingSoonScreen } from '@/components/trellis/coming-soon-screen';
import { getTab } from '@/lib/route-map';

export default function FunderWhereItWentPage() {
  return <ComingSoonScreen tab={getTab('/funder/where-it-went')} body={"You'll see every purchase your money covers, right here."} />;
}
