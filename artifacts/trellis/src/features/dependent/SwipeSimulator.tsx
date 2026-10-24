import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Beer,
  BookOpen,
  Car,
  Clapperboard,
  CreditCard,
  Dices,
  Gamepad2,
  ShoppingBasket,
  Smartphone,
  Snowflake,
  Store,
  Wine,
  type LucideIcon,
} from 'lucide-react';
import { BRAND } from '@brand/brand.config';
import { useCreateSwipe, useGetCard, useGetPolicy, useListMerchants, type Card, type Merchant } from '@workspace/api-client-react';
import { MerchantTile } from '@/components/trellis/merchant-tile';
import { SectionTitle } from '@/components/trellis/primitives';
import { LoadingRegion, Skeleton } from '@/components/trellis/skeletons';
import { ErrorState } from '@/components/trellis/states';
import { apiErrorMessage, refreshAfterSwipe } from '@/features/family/spending';
import { ScreenHeader } from '@/features/shell/layout';
import { arrangeMerchants, buildSwipeRequest, formatClock, type MerchantSwipe, type SwipePreset } from '@/lib/swipe-presets';
import { cn } from '@/lib/utils';
import { RecentSwipes } from './RecentSwipes';
import { SwipeResultDialog, type ShownSwipe } from './SwipeResultDialog';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  grocery: ShoppingBasket,
  bookstore: BookOpen,
  bar: Beer,
  liquor: Wine,
  gambling: Dices,
  gaming: Gamepad2,
  rideshare: Car,
  electronics: Smartphone,
  movies: Clapperboard,
};

export default function SwipeSimulator() {
  const merchants = useListMerchants();
  const card = useGetCard();
  // The family's clock, for presets simulated at a set time (the 2:10am ride).
  const policy = useGetPolicy();
  const queryClient = useQueryClient();
  const swipe = useCreateSwipe();
  const [swipingId, setSwipingId] = useState<number | null>(null);
  const [shown, setShown] = useState<ShownSwipe | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  if (merchants.isLoading || card.isLoading || policy.isLoading) {
    return (
      <LoadingRegion label="Loading the shops" className="flex flex-col gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-[72px] rounded-card-sm" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-[148px] rounded-card-sm" />
          ))}
        </div>
      </LoadingRegion>
    );
  }
  if (merchants.isError || card.isError || policy.isError || !merchants.data || !card.data || !policy.data) {
    return (
      <ErrorState
        onRetry={() => {
          void merchants.refetch();
          void card.refetch();
          void policy.refetch();
        }}
        retrying={merchants.isFetching || card.isFetching || policy.isFetching}
      />
    );
  }

  const cardData = card.data;
  const timeZone = policy.data.timeZone;
  const arranged = arrangeMerchants(merchants.data);
  const demoSwipes = arranged.filter((m) => m.preset?.spec);
  const moreShops = arranged.filter((m) => !m.preset?.spec);

  const onSwipe = (merchant: Merchant, preset: SwipePreset) => {
    if (swipe.isPending) return;
    setFailure(null);
    setSwipingId(merchant.id);
    swipe.mutate(
      { data: buildSwipeRequest({ card: cardData, merchant, preset, now: new Date(), timeZone }) },
      {
        onSuccess: (result) => setShown({ result, merchant, preset, decidedAt: new Date() }),
        onError: (error) => setFailure(apiErrorMessage(error, `The swipe at ${merchant.name} didn't go through. Try again.`)),
        onSettled: () => {
          setSwipingId(null);
          void refreshAfterSwipe(queryClient);
        },
      },
    );
  };

  const tiles = (list: MerchantSwipe[]) => (
    <div className="grid grid-cols-2 gap-3">
      {list.map(({ merchant, preset }) => (
        <MerchantTile
          key={merchant.id}
          name={merchant.name}
          category={merchant.category}
          mcc={merchant.mcc}
          amountCents={preset?.amountCents ?? null}
          timeNote={preset?.clock ? `at ${formatClock(preset.clock)}` : undefined}
          icon={CATEGORY_ICONS[merchant.category] ?? Store}
          loading={swipingId === merchant.id}
          onSwipe={preset ? () => onSwipe(merchant, preset) : undefined}
          data-testid={`button-swipe-merchant-${merchant.id}`}
        />
      ))}
    </div>
  );

  return (
    <>
      <ScreenHeader title="Swipe" subtitle="Tap a shop to try your card. The card decides on the spot, with test dollars." />
      <CardStatus card={cardData} />

      {failure && (
        <p role="alert" className="type-body-sm mt-4 flex items-start gap-2 rounded-card-sm bg-rejected-bg p-4" data-testid="text-swipe-error">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-rejected" aria-hidden="true" />
          <span>{failure}</span>
        </p>
      )}

      <section className="mt-8" aria-labelledby="demo-swipes-title">
        <SectionTitle>
          <span id="demo-swipes-title">Demo swipes</span>
        </SectionTitle>
        {tiles(demoSwipes)}
      </section>

      {moreShops.length > 0 && (
        <section className="mt-8" aria-labelledby="more-shops-title">
          <SectionTitle>
            <span id="more-shops-title">More shops</span>
          </SectionTitle>
          {tiles(moreShops)}
        </section>
      )}

      <RecentSwipes holderName={cardData.dependentName} className="mt-8" />

      <SwipeResultDialog shown={shown} onClose={() => setShown(null)} />
    </>
  );
}

/** The card's state from the API, so a frozen card is obvious before a swipe. */
function CardStatus({ card }: { card: Card }) {
  const frozen = card.status === 'frozen';
  const inactive = card.status === 'issued';
  const Icon = frozen ? Snowflake : CreditCard;
  return (
    <div
      className={cn('flex items-center gap-3 rounded-card-sm p-4', frozen ? 'bg-tint' : 'border bg-surface')}
      data-testid="card-swipe-card-status"
    >
      <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', frozen ? 'bg-surface text-primary' : 'bg-surface-alt text-ink')}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="type-link-sm">
          <span data-testid="text-swipe-card-status">{frozen ? 'Your card is frozen' : inactive ? "Your card isn't active yet" : 'Your card is on'}</span>{' '}
          <span className="tnum font-normal text-ink-muted">•••• {card.last4}</span>
        </p>
        <p className="type-caption mt-0.5 text-ink-muted">
          {frozen
            ? `Every swipe is declined until ${BRAND.demo.parent} unfreezes it.`
            : inactive
              ? 'Swipes are declined until the card is activated.'
              : 'Simulated card · test dollars only'}
        </p>
      </div>
    </div>
  );
}
