import { Bell, Gift, ShieldCheck } from 'lucide-react';
import { BRAND } from '@brand/brand.config';
import { LogoMark, PillButton, Wordmark, brandAsset } from '@/components/trellis/primitives';
import { PhoneColumn } from './layout';
import { useSession } from './session';

const points = [
  { Icon: ShieldCheck, title: 'Parents set the rules', body: 'Spending limits per bucket, and places the card never works.' },
  { Icon: Gift, title: 'Family chips in', body: 'Grandparents and co-parents add money to the buckets they choose.' },
  { Icon: Bell, title: 'Bigger buys ask first', body: 'Anything over a limit waits for a quick OK.' },
];

/** Branded welcome for signed-out visitors. Never names the sign-in provider. */
export function SignedOut() {
  const { login } = useSession();
  return (
    <PhoneColumn>
      <div className="header-sky-clear px-6 pb-20 pt-12">
        <Wordmark onDark />
        <h1 className="type-display-md mt-14 text-on-signature" data-testid="text-tagline">{BRAND.tagline}</h1>
      </div>
      {/* Solid surface, firm border and soft shadow so each card reads over the lime band and backdrop. */}
      <ul className="-mt-10 flex flex-col gap-3 px-6" data-testid="list-signed-out-points">
        {points.map(({ Icon, title, body }) => (
          <li key={title} data-testid="card-signed-out-point" className="flex items-start gap-3 rounded-card-sm border border-ink/15 bg-surface p-4 shadow-lg shadow-ink/10">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-tint text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="type-link-sm">{title}</h2>
              <p className="type-caption text-ink-muted">{body}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-col gap-3 px-6 pb-10 pt-8">
        <PillButton block onClick={login} data-testid="button-login">
          Log in
        </PillButton>
        <p className="type-caption text-center text-ink-muted">A testnet demo. No real money moves.</p>
        <p className="type-caption flex items-center justify-center gap-1.5 text-ink-muted" data-testid="text-powered-by">
          <span>{BRAND.copy.poweredByLabel}</span>
          {/* Official partner logo: fixed height, natural width, never recoloured or cropped. */}
          <img
            src={brandAsset(BRAND.partnerLogo.src)}
            alt={BRAND.partnerLogo.alt}
            className="h-[18px] w-auto"
            data-testid="img-partner-logo"
          />
        </p>
      </div>
    </PhoneColumn>
  );
}

/** Shown while the sign-in check is in flight. */
export function SessionSplash() {
  return (
    <PhoneColumn>
      <div role="status" aria-live="polite" className="flex flex-1 items-center justify-center" data-testid="state-session-loading">
        <LogoMark className="size-14 animate-pulse" />
        <span className="sr-only">Checking your sign-in</span>
      </div>
    </PhoneColumn>
  );
}
