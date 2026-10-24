import { BRAND } from '@brand/brand.config';
import { ComingSoonScreen } from '@/components/trellis/coming-soon-screen';
import { getTab } from '@/lib/route-map';

export default function ParentCardPage() {
  return <ComingSoonScreen tab={getTab('/parent/card')} body={`${BRAND.demo.dependent}'s card and spending rules will live here.`} />;
}
