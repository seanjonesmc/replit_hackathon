import { BRAND } from '@brand/brand.config';

export default function Problem() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-sand font-body text-ink">
      <div className="relative h-full px-[6vw] pt-[7vh] pb-[4vh] flex flex-col">
        <p className="text-[1.6vw] font-bold tracking-[0.1em] uppercase text-primary">The problem</p>

        <h2 className="mt-[2vh] font-display font-bold text-[2.7vw] leading-[1.2] tracking-[-0.02em] [text-wrap:pretty]">
          Nearly three in four parents still hand over allowance in cash, half say they struggle to keep an eye on their kids' spending without feeling controlling, and families sending money abroad through a bank pay about 15% to move $200.
        </h2>

        <div className="mt-[5vh] grid grid-cols-3 gap-x-[2.4vw]">
          <div className="border-t-[0.25vh] border-ink pt-[2.4vh]">
            <p className="font-display font-bold text-[7vw] leading-none tracking-[-0.04em] text-primary">73%</p>
            <p className="mt-[1.6vh] text-[2vw] leading-[1.3] [text-wrap:pretty]">of parents who give an allowance pay at least partly in cash</p>
            <p className="mt-[2vh] text-[1.5vw] leading-[1.35] text-muted">Source: Wells Fargo / Ipsos Family Banking survey, 2025 (about 1,600 US parents)</p>
          </div>

          <div className="border-t-[0.25vh] border-ink pt-[2.4vh]">
            <p className="font-display font-bold text-[7vw] leading-none tracking-[-0.04em] text-primary">50%</p>
            <p className="mt-[1.6vh] text-[2vw] leading-[1.3] [text-wrap:pretty]">find it hard to track a kid's spending without feeling controlling</p>
            <p className="mt-[2vh] text-[1.5vw] leading-[1.35] text-muted">Source: same survey; 87% say monitoring helps them guide their kids</p>
          </div>

          <div className="border-t-[0.25vh] border-ink pt-[2.4vh]">
            <p className="font-display font-bold text-[7vw] leading-none tracking-[-0.04em] text-primary">~15%</p>
            <p className="mt-[1.6vh] text-[2vw] leading-[1.3] [text-wrap:pretty]">average cost to send $200 abroad through a bank, vs 6.4% overall</p>
            <p className="mt-[2vh] text-[1.5vw] leading-[1.35] text-muted">Source: World Bank, Remittance Prices Worldwide, Q3 2025</p>
          </div>
        </div>

        <p className="mt-auto text-[1.5vw] text-muted">{BRAND.appName} · testnet-only demo</p>
      </div>
    </div>
  );
}
