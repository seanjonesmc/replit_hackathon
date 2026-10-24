import { Screen } from '@/features/shell/layout';
import ParentApprovals from '@/features/parent/ParentApprovals';
import { getTab } from '@/lib/route-map';

export default function ParentApprovalsPage() {
  return (
    <Screen tab={getTab('/parent/approvals')}>
      <ParentApprovals />
    </Screen>
  );
}
