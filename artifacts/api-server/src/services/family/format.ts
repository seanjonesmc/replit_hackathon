/**
 * Money formatting for server-written sentences (activity summaries, policy
 * lines, decision reasons). Whole-dollar amounts drop the cents ("$75"),
 * everything else keeps them ("$31.27").
 */
export function formatMoney(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const whole = abs % 100 === 0;
  return (
    sign +
    "$" +
    (abs / 100).toLocaleString("en-US", {
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
    })
  );
}

/** Always two decimals ("$32.00"), for amounts people compare against receipts. */
export function formatAmount(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return (
    sign +
    "$" +
    (Math.abs(cents) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}
