# Parent

Parent screens: home (family pot, buckets, pending approvals), add money,
approvals inbox, activity, card & policy, and settings (account, how the demo
maps to production, roadmap). Add money is a sub-screen opened from the family
pot on home (not a tab); it reuses the funder's Add money flow with the
parent's own member record and bank. The card can be frozen and unfrozen;
approve/decline, the policy builder and reset are shown disabled until their
phases. Compose shared UI from `components/trellis`; never enforce policy in
the browser.
