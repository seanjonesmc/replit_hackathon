---
name: Parent approval decisions
description: Who may answer a pending purchase (presenter mode) and why some purchases can only be declined.
---
- Parent answers are bound to the signed-in account: a member linked to an account acts only from it; unlinked seeded members can be played by the one presenter ("presenter mode").
  **Why:** a code review rejected trusting a client-sent parent id; the demo still needs one presenter to play every role.
  **How to apply:** any new money-moving action taken "as" a member should use the same rule; linking real accounts later tightens it without code changes.
- Only purchases at a seeded merchant whose category maps to a bucket can be approved; others can only be declined.
  **Why:** a temporary pass needs a merchant id and the rules honour passes only at the mapped-bucket step; loosening means changing passes and rules together.
