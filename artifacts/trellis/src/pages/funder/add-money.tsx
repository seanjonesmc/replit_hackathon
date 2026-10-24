import { BRAND } from '@brand/brand.config';
import { ComingSoonScreen } from '@/components/trellis/coming-soon-screen';
import { getTab } from '@/lib/route-map';

export default function FunderAddMoneyPage() {
  return <ComingSoonScreen tab={getTab('/funder/add-money')} body={`Adding money from your bank to ${BRAND.demo.dependent}'s buckets will happen here.`} />;
}
