import { useId, useState, type FormEvent } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AlertCircle, CreditCard, X } from 'lucide-react';
import type { Merchant } from '@workspace/api-client-react';
import { PillButton } from '@/components/trellis/primitives';
import { parseDollarsToCents } from '@/lib/format';
import { findMerchantByName, parseItems, PURCHASE_CATEGORIES, type CustomPurchase } from '@/lib/swipe-presets';
import { cn } from '@/lib/utils';

const TYPED = 'typed';

const fieldCls =
  'w-full rounded-card-sm border-2 border-transparent bg-surface-alt px-4 text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-primary';
const labelCls = 'type-label mb-2 block px-1 text-ink-muted';

interface CustomPurchaseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchants: readonly Merchant[];
  /** Sends the swipe; the result shows in the usual result screen. */
  onSubmit: (purchase: CustomPurchase) => void;
  submitting: boolean;
  /** Why the last swipe didn't go through. */
  error: string | null;
}

/**
 * Any store, items, amount and time, for trying the card live. A picked or
 * typed seeded store swipes as that merchant; any other name swipes with the
 * chosen category. The server decides; nothing here predicts the result.
 */
export function CustomPurchaseSheet({ open, onOpenChange, merchants, onSubmit, submitting, error }: CustomPurchaseSheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40" />
        <DialogPrimitive.Content
          className="pb-safe fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-phone flex-col overflow-y-auto rounded-t-card bg-surface p-6 outline-none"
          aria-describedby={undefined}
          data-testid="sheet-custom-purchase"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="type-title">Custom purchase</DialogPrimitive.Title>
              <p className="type-caption mt-1 text-ink-muted">Any store, any amount. The card decides like a real swipe.</p>
            </div>
            <DialogPrimitive.Close
              className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-alt text-ink transition-colors hover:bg-ink/[0.06]"
              aria-label="Close"
              data-testid="button-close-custom-purchase"
            >
              <X className="size-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          {open && <CustomPurchaseForm merchants={merchants} onSubmit={onSubmit} submitting={submitting} error={error} />}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function CustomPurchaseForm({ merchants, onSubmit, submitting, error }: Omit<CustomPurchaseSheetProps, 'open' | 'onOpenChange'>) {
  const id = useId();
  const [store, setStore] = useState<string>(merchants[0] ? String(merchants[0].id) : TYPED);
  const [typedName, setTypedName] = useState('');
  const [category, setCategory] = useState(PURCHASE_CATEGORIES[0]!.category);
  const [items, setItems] = useState('');
  const [amount, setAmount] = useState('');
  const [clock, setClock] = useState('');
  const [tried, setTried] = useState(false);

  const picked = store === TYPED ? undefined : merchants.find((m) => String(m.id) === store);
  const storeName = picked?.name ?? typedName.trim();
  // A typed name that matches a seeded store swipes as that store.
  const seeded = picked ?? findMerchantByName(merchants, typedName);
  const chosenCategory = PURCHASE_CATEGORIES.find((c) => c.category === category) ?? PURCHASE_CATEGORIES[0]!;
  const amountCents = parseDollarsToCents(amount);
  const itemList = parseItems(items);

  const problems = {
    store: storeName ? null : 'Type the store name.',
    amount: amountCents !== null && amountCents > 0 && amountCents <= 1_000_000 ? null : 'Enter an amount up to $10,000.',
  };
  const valid = !problems.store && !problems.amount;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!valid || submitting) return;
    onSubmit({
      storeName,
      category: chosenCategory,
      items: itemList,
      amountCents: amountCents!,
      clock: clock || undefined,
    });
  };

  const showError = (field: keyof typeof problems) => tried && problems[field];

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div>
        <label htmlFor={`${id}-store`} className={labelCls}>
          Store
        </label>
        <select
          id={`${id}-store`}
          value={store}
          onChange={(e) => setStore(e.target.value)}
          className={cn(fieldCls, 'type-body-sm h-12')}
          data-testid="select-custom-store"
        >
          {merchants.map((m) => (
            <option key={m.id} value={String(m.id)}>
              {m.name}
            </option>
          ))}
          <option value={TYPED}>Another store…</option>
        </select>
      </div>

      {store === TYPED && (
        <div>
          <label htmlFor={`${id}-name`} className={labelCls}>
            Store name
          </label>
          <input
            id={`${id}-name`}
            value={typedName}
            maxLength={120}
            autoComplete="off"
            placeholder="e.g. Corner Café"
            onChange={(e) => setTypedName(e.target.value)}
            aria-invalid={showError('store') ? true : undefined}
            className={cn(fieldCls, 'type-body-sm h-12', showError('store') && 'border-rejected focus:border-rejected')}
            data-testid="input-custom-store-name"
          />
          {showError('store') && <p className="type-caption mt-1 px-1 text-rejected">{problems.store}</p>}
        </div>
      )}

      <div>
        <label htmlFor={`${id}-category`} className={labelCls}>
          Category
        </label>
        {seeded ? (
          <p className="type-body-sm rounded-card-sm bg-surface-alt px-4 py-3" id={`${id}-category`} data-testid="text-custom-category">
            <span className="capitalize">{seeded.category}</span>
            <span className="text-ink-muted"> · MCC {seeded.mcc} · set by the store</span>
          </p>
        ) : (
          <select
            id={`${id}-category`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={cn(fieldCls, 'type-body-sm h-12')}
            data-testid="select-custom-category"
          >
            {PURCHASE_CATEGORIES.map((c) => (
              <option key={c.category} value={c.category}>
                {c.label} · MCC {c.mcc}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label htmlFor={`${id}-items`} className={labelCls}>
          Items <span className="font-normal">(separate with commas)</span>
        </label>
        <input
          id={`${id}-items`}
          value={items}
          autoComplete="off"
          placeholder="e.g. bananas, oat milk"
          onChange={(e) => setItems(e.target.value)}
          className={cn(fieldCls, 'type-body-sm h-12')}
          data-testid="input-custom-items"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${id}-amount`} className={labelCls}>
            Amount
          </label>
          <div className="relative">
            <span className="type-body-sm pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true">
              $
            </span>
            <input
              id={`${id}-amount`}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={showError('amount') ? true : undefined}
              className={cn(fieldCls, 'type-body-sm tnum h-12 pl-8', showError('amount') && 'border-rejected focus:border-rejected')}
              data-testid="input-custom-amount"
            />
          </div>
        </div>
        <div>
          <label htmlFor={`${id}-time`} className={labelCls}>
            Time <span className="font-normal">(optional)</span>
          </label>
          <input
            id={`${id}-time`}
            type="time"
            value={clock}
            onChange={(e) => setClock(e.target.value)}
            className={cn(fieldCls, 'type-body-sm tnum h-12')}
            data-testid="input-custom-time"
          />
        </div>
      </div>
      {showError('amount') && <p className="type-caption -mt-3 px-1 text-rejected">{problems.amount}</p>}
      <p className="type-caption -mt-2 px-1 text-ink-muted">Leave the time empty to swipe now. Times are on the family's clock.</p>

      {error && (
        <p role="alert" className="type-body-sm flex items-start gap-2 rounded-card-sm bg-rejected-bg p-4" data-testid="text-custom-purchase-error">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-rejected" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      <PillButton type="submit" block loading={submitting} icon={<CreditCard className="size-4" aria-hidden="true" />} data-testid="button-custom-swipe">
        Swipe the card
      </PillButton>
    </form>
  );
}
