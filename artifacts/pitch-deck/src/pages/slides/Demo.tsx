import { BRAND } from '@brand/brand.config';

export default function Demo() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-sand font-body text-ink">
      <div className="relative h-full px-[6vw] pt-[7vh] pb-[4vh] flex flex-col">
        <div className="flex items-end justify-between gap-[2vw]">
          <h2 className="font-display font-bold text-[5vw] leading-none tracking-[-0.03em]">Planned demo</h2>
          <p className="text-[2vw] text-muted whitespace-nowrap">{BRAND.demo.familyName} · expected results</p>
        </div>

        <div className="mt-[4.4vh] flex flex-col">
          <div className="grid grid-cols-12 gap-x-[2vw] items-center border-t-[0.15vh] border-hairline py-[1.9vh]">
            <p className="col-span-1 font-display font-bold text-[2.4vw] text-primary">01</p>
            <p className="col-span-8 text-[2vw] leading-[1.3]"><span className="font-bold">{BRAND.demo.funders[0]}</span> adds $50 from {BRAND.demo.banks[0]} to Food</p>
            <div className="col-span-3 justify-self-end rounded-pill bg-chain-bg px-[1.2vw] py-[0.8vh] text-[1.5vw] font-bold text-chain">Funded</div>
          </div>

          <div className="grid grid-cols-12 gap-x-[2vw] items-center border-t-[0.15vh] border-hairline py-[1.9vh]">
            <p className="col-span-1 font-display font-bold text-[2.4vw] text-primary">02</p>
            <p className="col-span-8 text-[2vw] leading-[1.3]"><span className="font-bold">{BRAND.demo.dependent}</span> swipes at a bar</p>
            <div className="col-span-3 justify-self-end rounded-pill bg-rejected-bg px-[1.2vw] py-[0.8vh] text-[1.5vw] font-bold text-rejected">Declined · blocked</div>
          </div>

          <div className="grid grid-cols-12 gap-x-[2vw] items-center border-t-[0.15vh] border-hairline py-[1.9vh]">
            <p className="col-span-1 font-display font-bold text-[2.4vw] text-primary">03</p>
            <p className="col-span-8 text-[2vw] leading-[1.3]"><span className="font-bold">{BRAND.demo.dependent}</span> buys groceries; {BRAND.demo.funders[0]} sees where it went</p>
            <div className="col-span-3 justify-self-end rounded-pill bg-approved-bg px-[1.2vw] py-[0.8vh] text-[1.5vw] font-bold text-approved">Approved</div>
          </div>

          <div className="grid grid-cols-12 gap-x-[2vw] items-center border-t-[0.15vh] border-hairline py-[1.9vh]">
            <p className="col-span-1 font-display font-bold text-[2.4vw] text-primary">04</p>
            <p className="col-span-8 text-[2vw] leading-[1.3]"><span className="font-bold">{BRAND.demo.dependent}</span> tries a $129 electronics purchase</p>
            <div className="col-span-3 justify-self-end rounded-pill bg-pending-bg px-[1.2vw] py-[0.8vh] text-[1.5vw] font-bold text-pending">Pending · {BRAND.copy.askParentLabel}</div>
          </div>

          <div className="grid grid-cols-12 gap-x-[2vw] items-center border-t-[0.15vh] border-hairline py-[1.9vh]">
            <p className="col-span-1 font-display font-bold text-[2.4vw] text-primary">05</p>
            <p className="col-span-8 text-[2vw] leading-[1.3]"><span className="font-bold">{BRAND.demo.parent}</span> approves; the purchase retries and settles</p>
            <div className="col-span-3 justify-self-end rounded-pill bg-approved-bg px-[1.2vw] py-[0.8vh] text-[1.5vw] font-bold text-approved">Approved</div>
          </div>

          <div className="grid grid-cols-12 gap-x-[2vw] items-center border-y-[0.15vh] border-hairline py-[1.9vh]">
            <p className="col-span-1 font-display font-bold text-[2.4vw] text-primary">06</p>
            <p className="col-span-8 text-[2vw] leading-[1.3]"><span className="font-bold">{BRAND.demo.parent}</span> freezes card ••{BRAND.demo.cardLast4}; the next swipe fails</p>
            <div className="col-span-3 justify-self-end rounded-pill bg-rejected-bg px-[1.2vw] py-[0.8vh] text-[1.5vw] font-bold text-rejected">Declined · frozen</div>
          </div>
        </div>

        <p className="mt-auto text-[1.5vw] text-muted">Planned flow, screens not built yet · simulated bank and card, test dollars only · testnet-only</p>
      </div>
    </div>
  );
}
