# Parent

Parent screens: home (family pot, buckets, pending approvals), add money,
approvals inbox, activity, card & policy, and settings (account, how the demo
maps to production, roadmap). Add money is a sub-screen opened from the family
pot on home (not a tab); it reuses the funder's Add money flow with the
parent's own member record and bank. The card can be frozen and unfrozen, and
pending purchases approved or declined (the server re-runs an approved one).
Reset is shown disabled until its phase. The
plain-English rules builder on Card & policy is a front-end-only simulation
(`policy-builder/`): the screen starts with only the per-bucket limits, and
the builder reveals lines the real policy already enforces. Nothing is parsed
by an AI, sent or saved; a reload resets it. Compose shared UI from
`components/trellis`; never enforce policy in the browser.
