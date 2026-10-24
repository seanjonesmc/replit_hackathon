import type { Card, CardStatus } from '@workspace/api-client-react';
import { formatExpiry } from '@/lib/format';

const statusLabel: Record<CardStatus, string> = {
  issued: 'Issued',
  active: 'Active',
  frozen: 'Frozen',
};

/** The card's status and expiry, shown under the card art. */
export function CardFacts({ card }: { card: Card }) {
  return (
    <p className="type-caption mt-2 text-ink-muted" data-testid="text-card-facts">
      <span className="font-semibold text-ink" data-testid="text-card-status">{statusLabel[card.status]}</span>
      {' · '}Expires <span className="tnum">{formatExpiry(card.expiryMonth, card.expiryYear)}</span>
      {' · '}Test dollars only
    </p>
  );
}
