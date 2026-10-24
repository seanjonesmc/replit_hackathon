# Funder

Grandparent screens: add money and "where my money went" (their
contributions). The funder is the family member with the grandparent
relationship (`use-funder.ts`).

Add money sends in one tap: a simulated deposit into the funder's bank, then a
contribution of the same amount into the chosen bucket, with an optional note
(default "<bucket>, from <funder>"). The confirmation shows the partner bank's
dollar-to-USDC step and follows the contribution's real chain status until it
links to the explorer or the write fails. The USDC is the project's test
dollar token on Monad testnet, and the screens say so. Attribution of
purchases to contributions is a later phase. No real-money behavior.
