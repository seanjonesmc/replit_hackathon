import { Screen } from '@/features/shell/layout';
import FunderAddMoney from '@/features/funder/FunderAddMoney';
import { getTab } from '@/lib/route-map';

export default function FunderAddMoneyPage() {
  return (
    <Screen tab={getTab('/funder/add-money')}>
      <FunderAddMoney />
    </Screen>
  );
}
