---
name: Effect bodies and browser APIs that now return Promises
description: Why React effects in this app use braces, not expression arrows, around browser calls.
---
Current Chrome returns a Promise from `window.scrollTo()` (and the other scroll
methods). An expression-bodied effect such as `useEffect(() => window.scrollTo(0, 0))`
hands that Promise to React as the cleanup, and the next route change crashes with
"destroy is not a function". happy-dom returns undefined, so unit tests pass unless
they stub the API to return a Promise.

**Why:** this shipped once in the app shell and only showed up in a real browser.

**How to apply:** always write effect bodies in braces when they call browser APIs;
when testing such effects, stub the API to return a Promise like current browsers do.
