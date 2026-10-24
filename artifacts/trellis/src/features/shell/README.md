# Shell

Sign-in and the pieces every signed-in screen shares. The role switcher, tab
bars and route map are the app shell in `components/app-shell.tsx`,
`components/trellis/` and `lib/route-map.ts`.

- `session.tsx` checks the session once and shares the user, `login` and `logout`.
- `SignedOut.tsx` is the branded welcome; it never names the sign-in provider.
- `layout.tsx` holds the phone column (signed-out screens), the per-tab
  `Screen` wrapper and the `ScreenHeader` every screen uses.
