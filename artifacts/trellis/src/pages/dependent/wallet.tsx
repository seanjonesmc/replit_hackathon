import { Screen } from '@/features/shell/layout';
import DependentWallet from '@/features/dependent/DependentWallet';
import { getTab } from '@/lib/route-map';

export default function DependentWalletPage() {
  return (
    <Screen tab={getTab('/dependent/wallet')}>
      <DependentWallet />
    </Screen>
  );
}
