import { BRAND } from '@brand/brand.config';

export default function Testnet() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-primary font-body text-surface">
      <div className="absolute inset-x-0 top-0 h-[45vh] bg-gradient-to-b from-signature to-primary" />

      <div className="relative h-full px-[6vw] pt-[7vh] pb-[6vh] flex flex-col">
        <h2 className="font-display font-bold text-[5vw] leading-none tracking-[-0.03em]">How it will run on testnet</h2>
        <p className="mt-[2.4vh] max-w-[80vw] text-[2.2vw] leading-[1.35] text-surface/85 [text-wrap:pretty]">Planned architecture: the whole bank and card stack will be simulated on Monad testnet.</p>

        <div className="mt-[6vh] grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-stretch gap-x-[1vw]">
          <div className="rounded-card-sm bg-surface text-ink p-[1.8vw] flex flex-col">
            <p className="text-[1.5vw] font-bold uppercase tracking-[0.08em] text-primary">Simulated</p>
            <p className="mt-[1.2vh] text-[2.3vw] font-bold leading-[1.1]">Demo bank</p>
            <p className="mt-[1.2vh] text-[2vw] leading-[1.3] text-muted">Deposits will mint test dollars</p>
          </div>
          <svg viewBox="0 0 24 24" className="self-center w-[2.4vw] h-[2.4vw] stroke-surface fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h15" /><path d="M13 6l6 6-6 6" /></svg>

          <div className="rounded-card-sm bg-surface text-ink p-[1.8vw] flex flex-col">
            <p className="text-[1.5vw] font-bold uppercase tracking-[0.08em] text-primary">Contract</p>
            <p className="mt-[1.2vh] text-[2.3vw] font-bold leading-[1.1]">Pot and buckets</p>
            <p className="mt-[1.2vh] text-[2vw] leading-[1.3] text-muted">Will track who funded what</p>
          </div>
          <svg viewBox="0 0 24 24" className="self-center w-[2.4vw] h-[2.4vw] stroke-surface fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h15" /><path d="M13 6l6 6-6 6" /></svg>

          <div className="rounded-card-sm bg-surface text-ink p-[1.8vw] flex flex-col">
            <p className="text-[1.5vw] font-bold uppercase tracking-[0.08em] text-primary">Backend</p>
            <p className="mt-[1.2vh] text-[2.3vw] font-bold leading-[1.1]">Rules first</p>
            <p className="mt-[1.2vh] text-[2vw] leading-[1.3] text-muted">Designed so AI never overrides a hard rule</p>
          </div>
          <svg viewBox="0 0 24 24" className="self-center w-[2.4vw] h-[2.4vw] stroke-surface fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h15" /><path d="M13 6l6 6-6 6" /></svg>

          <div className="rounded-card-sm bg-surface text-ink p-[1.8vw] flex flex-col">
            <p className="text-[1.5vw] font-bold uppercase tracking-[0.08em] text-primary">On-chain</p>
            <p className="mt-[1.2vh] text-[2.3vw] font-bold leading-[1.1]">Card decision</p>
            <p className="mt-[1.2vh] text-[2vw] leading-[1.3] text-muted">To be recorded with an explorer link</p>
          </div>
        </div>

        <div className="mt-auto border-t-[0.2vh] border-surface/40 pt-[3vh]">
          <p className="text-[2.6vw] font-bold leading-[1.25] [text-wrap:balance]">Testnet only. No real money, no real bank linking, no real cards.</p>
          <p className="mt-[1.2vh] text-[1.6vw] text-surface/85">Planned, not yet built. "{BRAND.copy.verifiedLabel}" will appear only after a confirmed testnet transaction.</p>
        </div>
      </div>
    </div>
  );
}
