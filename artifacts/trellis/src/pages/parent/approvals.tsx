import { BRAND } from '@brand/brand.config';
import { ComingSoonScreen } from '@/components/trellis/coming-soon-screen';
import { getTab } from '@/lib/route-map';

export default function ParentApprovalsPage() {
  return <ComingSoonScreen tab={getTab('/parent/approvals')} body={`Purchases ${BRAND.demo.dependent} asks you to approve will wait here.`} />;
}
