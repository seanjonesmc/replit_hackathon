import { AddMoneyFlow } from './AddMoneyFlow';
import { useFunderContributions } from './use-funder';

/** The grandparent's Add money tab. */
export default function FunderAddMoney() {
  const funding = useFunderContributions();
  const name = funding.funder?.displayName;
  return <AddMoneyFlow funding={funding} title={name ? `Hi, ${name}` : 'Add money'} subtitle="Pick a bucket to top up." />;
}
