import { BRAND } from '@brand/brand.config';
import { ComingSoonScreen } from '@/components/trellis/coming-soon-screen';
import { getTab } from '@/lib/route-map';

export default function ParentHomePage() {
  return <ComingSoonScreen tab={getTab('/parent/home')} body={`The family pot and each of ${BRAND.demo.dependent}'s buckets will show here.`} />;
}
