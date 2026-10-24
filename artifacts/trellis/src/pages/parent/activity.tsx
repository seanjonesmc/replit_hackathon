import { BRAND } from '@brand/brand.config';
import { ComingSoonScreen } from '@/components/trellis/coming-soon-screen';
import { getTab } from '@/lib/route-map';

export default function ParentActivityPage() {
  return <ComingSoonScreen tab={getTab('/parent/activity')} body={`Every purchase ${BRAND.demo.dependent} makes will show here in plain English.`} />;
}
