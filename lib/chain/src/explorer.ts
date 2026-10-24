/** MonadVision, the Monad testnet block explorer. */
export const DEFAULT_EXPLORER_URL = "https://testnet.monadvision.com";

function base(explorerUrl: string): string {
  return explorerUrl.replace(/\/+$/, "");
}

/** Explorer page for a transaction. */
export function explorerTxUrl(explorerUrl: string, txHash: string): string {
  return `${base(explorerUrl)}/tx/${txHash}`;
}

/** Explorer page for a wallet or contract address. */
export function explorerAddressUrl(
  explorerUrl: string,
  address: string,
): string {
  return `${base(explorerUrl)}/address/${address}`;
}
