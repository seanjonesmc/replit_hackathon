# DownloadPill — implemented
Source: root design/reference/venmo.DESIGN.md:286-292.
Chunk 2; export components/ui/download-pill. No dependencies.
Ink-filled pill, white text, 44px high, 12px 24px padding, 1000px radius. Read source before building. Demo must not imply app-store availability.

Implemented from the cited visual specification; React native props are forwarded. Stories exercise all supported variants and exports. Dark surfaces are derived.
Reuses Radix Slot for asChild behavior. Demo covers button action, disabled state, and anchor composition without implying an available app download.
