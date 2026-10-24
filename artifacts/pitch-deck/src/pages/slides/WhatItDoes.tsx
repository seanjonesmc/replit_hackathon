import { BRAND } from '@brand/brand.config';

export default function WhatItDoes() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-sand font-body text-ink">
      <div className="relative h-full px-[6vw] pt-[7vh] pb-[4vh] flex flex-col">
        <h2 className="font-display font-bold text-[5vw] leading-none tracking-[-0.03em]">What {BRAND.appName} does</h2>
        <p className="mt-[2.4vh] max-w-[80vw] text-[2.2vw] leading-[1.35] text-muted [text-wrap:pretty]">Guidance before the money is spent, not surveillance after it.</p>

        <div className="mt-[6vh] grid grid-cols-4 gap-x-[1.6vw]">
          <div className="rounded-card bg-tint p-[2vw] pb-[3vw] flex flex-col">
            <svg viewBox="0 0 24 24" className="w-[3vw] h-[3vw] stroke-primary fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9h16l-1.5 10h-13z" /><path d="M8 9a4 4 0 0 1 8 0" /></svg>
            <p className="mt-[8vh] font-display font-bold text-[2.4vw] leading-none tracking-[-0.02em] text-primary">Pot</p>
            <p className="mt-[1.6vh] text-[2vw] leading-[1.3] [text-wrap:pretty]">Parents, grandparents and co-parents fund one shared pot</p>
          </div>

          <div className="rounded-card bg-tint p-[2vw] pb-[3vw] flex flex-col">
            <svg viewBox="0 0 24 24" className="w-[3vw] h-[3vw] stroke-primary fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="7" height="16" rx="1.5" /><rect x="14" y="4" width="7" height="9" rx="1.5" /><rect x="14" y="16" width="7" height="4" rx="1.5" /></svg>
            <p className="mt-[8vh] font-display font-bold text-[2.4vw] leading-none tracking-[-0.02em] text-primary">Buckets</p>
            <p className="mt-[1.6vh] text-[2vw] leading-[1.3] [text-wrap:pretty]">Food, School and Social, each with its own limits</p>
          </div>

          <div className="rounded-card bg-tint p-[2vw] pb-[3vw] flex flex-col">
            <svg viewBox="0 0 24 24" className="w-[3vw] h-[3vw] stroke-primary fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.7 2.7L16 9.8" /></svg>
            <p className="mt-[8vh] font-display font-bold text-[2.4vw] leading-none tracking-[-0.02em] text-primary">Approval</p>
            <p className="mt-[1.6vh] text-[2vw] leading-[1.3] [text-wrap:pretty]">Each purchase is checked against family rules first</p>
          </div>

          <div className="rounded-card bg-tint p-[2vw] pb-[3vw] flex flex-col">
            <svg viewBox="0 0 24 24" className="w-[3vw] h-[3vw] stroke-primary fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h10" /></svg>
            <p className="mt-[8vh] font-display font-bold text-[2.4vw] leading-none tracking-[-0.02em] text-primary">Transparency</p>
            <p className="mt-[1.6vh] text-[2vw] leading-[1.3] [text-wrap:pretty]">Funders see where their money went, in plain English</p>
          </div>
        </div>

        <p className="mt-auto text-[1.5vw] text-muted">{BRAND.appName} · testnet-only demo</p>
      </div>
    </div>
  );
}
