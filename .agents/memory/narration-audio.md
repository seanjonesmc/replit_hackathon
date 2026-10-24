---
name: Demo narration audio
description: Voice choice and tooling for producing the pitch video voiceover.
---
Make voiceover with the built-in `textToSpeech` callback (media-generation skill, audio-generation.md), not the external-API ElevenLabs passthrough. The user asked for the "normal voice agent" on 2026-10-24 after a first version used the passthrough.

**Why:** user preference; the built-in callback writes the file directly and doesn't need base64 or impure-function plumbing.

**How to apply:** voice "Sarah" (EXAVITQu4vr4xnSDxMaL, default voice), eleven_multilingual_v2, voiceSettings stability 0.55 / similarityBoost 0.75 / style 0.15 / speed 0.95, one call per paragraph, joined with ~0.6 s gaps and normalised to -16 LUFS / -1.5 dBTP. Reuse these settings when regenerating any paragraph so it matches the rest.

Tooling notes:
- textToSpeech writes under attached_assets/generated_audio/ by default; move outputs to /tmp and keep intermediates out of the repo.
- Neither TTS route can transcribe audio back here (the passthrough only takes JSON bodies, so speech-to-text uploads fail); pronunciation must be checked by listening.
- ffmpeg/ffprobe are on PATH.
