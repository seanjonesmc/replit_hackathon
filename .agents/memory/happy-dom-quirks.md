---
name: happy-dom test quirks
description: Behaviors of the happy-dom test environment that differ from real browsers and cost retries.
---
To simulate blocked storage, spy on the `window.localStorage` getter
(`vi.spyOn(window, 'localStorage', 'get')`). Spies on `Storage.prototype.getItem/setItem`
have no effect: happy-dom's storage methods are not taken from that prototype.
Restore mocks before any afterEach cleanup that touches `localStorage`, or the
cleanup itself throws.

**Why:** a prototype spy let the real storage through, so a "storage blocked"
test read the saved value instead of exercising the fallback.

**How to apply:** any trellis test that needs storage (or another browser API)
to fail should replace the accessor on `window`, then restore it first in teardown.
