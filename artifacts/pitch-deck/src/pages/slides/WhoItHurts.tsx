import { BRAND } from '@brand/brand.config';

export default function WhoItHurts() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-sand font-body text-ink">
      <div className="relative h-full px-[6vw] pt-[7vh] pb-[4vh] flex flex-col">
        <h2 className="font-display font-bold text-[5vw] leading-none tracking-[-0.03em]">Who it hurts</h2>

        <div className="mt-[3.5vh] flex flex-col">
          <div className="grid grid-cols-12 gap-x-[2vw] border-t-[0.15vh] border-hairline py-[2vh]">
            <p className="col-span-3 font-display font-bold text-[5.5vw] leading-none tracking-[-0.04em] text-primary">71%</p>
            <div className="col-span-9">
              <p className="text-[2.4vw] font-bold leading-[1.2]">Parents of kids at home</p>
              <p className="mt-[0.8vh] text-[2vw] leading-[1.35] [text-wrap:pretty]">give 5–17-year-olds an allowance; median about $20 a week</p>
              <p className="mt-[0.8vh] text-[1.5vw] text-muted">Source: Wells Fargo / Ipsos, 2025</p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-x-[2vw] border-t-[0.15vh] border-hairline py-[2vh]">
            <p className="col-span-3 font-display font-bold text-[5.5vw] leading-none tracking-[-0.04em] text-primary">600K+</p>
            <div className="col-span-9">
              <p className="text-[2.4vw] font-bold leading-[1.2]">Students far from home</p>
              <p className="mt-[0.8vh] text-[2vw] leading-[1.35] [text-wrap:pretty]">international students in the US rely mainly on family money, incl. 82% of undergrads</p>
              <p className="mt-[0.8vh] text-[1.5vw] text-muted">Source: IIE Open Doors 2025</p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-x-[2vw] border-y-[0.15vh] border-hairline py-[2vh]">
            <p className="col-span-3 font-display font-bold text-[5.5vw] leading-none tracking-[-0.04em] text-primary">~$3B</p>
            <div className="col-span-9">
              <p className="text-[2.4vw] font-bold leading-[1.2]">Families paying across borders</p>
              <p className="mt-[0.8vh] text-[2vw] leading-[1.35] [text-wrap:pretty]">sent abroad for studies by Indian families alone in FY2024–25</p>
              <p className="mt-[0.8vh] text-[1.5vw] text-muted">Source: Reserve Bank of India, LRS data</p>
            </div>
          </div>
        </div>

        <p className="mt-auto text-[1.5vw] text-muted">{BRAND.appName} · testnet-only demo</p>
      </div>
    </div>
  );
}
