import { BRAND } from '@brand/brand.config';

const base = import.meta.env.BASE_URL;
const logoMark = `${base}${BRAND.logo.mark.replace(/^\//, '')}`;

export default function Close() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-sand font-body text-ink">
      <div className="absolute inset-x-0 top-0 h-[55vh] bg-gradient-to-b from-signature via-signature/40 to-sand" />

      <div className="relative h-full px-[6vw] py-[8vh] flex flex-col">
        <div className="flex items-center gap-[1.2vw]">
          <img src={logoMark} crossOrigin="anonymous" alt={BRAND.logo.alt} className="w-[4.4vw] h-[4.4vw] rounded-[1vw] ring-[0.2vw] ring-surface" />
          <span className="text-[2.4vw] font-bold text-surface">{BRAND.appName}</span>
        </div>

        <div className="mt-auto">
          <p className="font-display font-bold text-[7.5vw] leading-[0.95] tracking-[-0.04em] max-w-[80vw] [text-wrap:balance]">{BRAND.tagline}</p>
          <div className="mt-[6vh] grid grid-cols-12 gap-x-[2vw] border-t-[0.15vh] border-hairline pt-[3vh]">
            <p className="col-span-7 text-[2.2vw] leading-[1.35] [text-wrap:pretty]">Families give dependents real money but rarely see how it is spent. One shared pot, rules set before money moves, and a record every funder can read.</p>
            <p className="col-span-5 text-[2vw] leading-[1.35] text-muted [text-wrap:pretty]">{BRAND.appName} is a testnet-only demo on Monad. No real money, banks or cards are involved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
