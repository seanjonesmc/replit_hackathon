import { BRAND } from '@brand/brand.config';
import coverPhoto from '@assets/generated_images/trellis-cover-student.jpg';

const base = import.meta.env.BASE_URL;
const logoMark = `${base}${BRAND.logo.mark.replace(/^\//, '')}`;

export default function Cover() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-sand font-body text-ink">
      <div className="absolute inset-x-0 top-0 h-[55vh] bg-gradient-to-b from-signature via-signature/40 to-sand" />

      <div className="relative h-full grid grid-cols-12 gap-x-[2vw] px-[6vw] py-[8vh]">
        <div className="col-span-7 flex flex-col justify-between">
          <div className="flex items-center gap-[1.2vw]">
            <img src={logoMark} crossOrigin="anonymous" alt={BRAND.logo.alt} className="w-[4.4vw] h-[4.4vw] rounded-[1vw] ring-[0.2vw] ring-surface" />
            <span className="text-[1.6vw] font-bold tracking-[0.1em] uppercase text-on-signature">Hackathon pitch</span>
          </div>

          <div>
            <h1 className="font-display font-bold text-[11vw] leading-[0.9] tracking-[-0.04em] text-ink">{BRAND.appName}</h1>
            <p className="mt-[2.4vh] text-[3.6vw] font-bold leading-[1.1] tracking-[-0.02em] text-primary [text-wrap:balance]">{BRAND.tagline}</p>
            <p className="mt-[4vh] max-w-[46vw] text-[2vw] leading-[1.4] text-muted [text-wrap:pretty]">Families fund one dependent. Parents set guardrails everyone can see.</p>
            <div className="mt-[4vh] inline-flex items-center rounded-pill bg-tint px-[1.6vw] py-[1.2vh]">
              <span className="text-[1.6vw] font-bold text-primary">Testnet-only demo on Monad · no real money</span>
            </div>
          </div>
        </div>

        <div className="col-span-5 relative">
          <img src={coverPhoto} crossOrigin="anonymous" alt="A college student checking his phone on campus steps" className="absolute inset-0 w-full h-full object-cover rounded-card" />
        </div>
      </div>
    </div>
  );
}
