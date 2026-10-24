import { Screen } from '@/features/shell/layout';
import FunderMoney from '@/features/funder/FunderMoney';
import { getTab } from '@/lib/route-map';

export default function FunderWhereItWentPage() {
  return (
    <Screen tab={getTab('/funder/where-it-went')}>
      <FunderMoney />
    </Screen>
  );
}
