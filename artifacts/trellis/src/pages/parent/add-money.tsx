import { Screen } from '@/features/shell/layout';
import ParentAddMoney from '@/features/parent/ParentAddMoney';
import { getSubScreen } from '@/lib/route-map';

export default function ParentAddMoneyPage() {
  return (
    <Screen tab={getSubScreen('/parent/add-money')}>
      <ParentAddMoney />
    </Screen>
  );
}
