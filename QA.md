# Release QA

Before the birthday link is sent, verify these on the actual deployed URL.

## iPhone / Safari
- Gate appears without a white flash.
- `И так…` and `НЕЕЕТ` fit without wrapping badly.
- Start tap unlocks sound (the site never relies on forbidden autoplay).
- No browser UI overlaps text in portrait mode.
- No horizontal scroll.
- Returning from a phone call / app switch shows `продолжить` instead of letting the story silently run ahead.
- Mute works before and after a scene transition.

## Story timing
- Total runtime: ~3:20.
- “ПОДАЧА!” has a clean silence/impact/comic release, not a meme effect.
- The vulnerable/blanket scene is not rushed.
- “Вечная зима” is the first recognisable musical-emotional lift.
- Before `…люблю.` the sound bed thins out; no competing music.
- The current-life pressure scene reads as “less time”, not “less love”.
- `Это же общее желание.` gets enough hold time to land.
- The final sticker exchange feels ordinary and familiar, not like a goodbye.
- Final impossible-light image stays long enough to read before the birthday epilogue.

## Optional real assets
- Real song excerpt starts on the intended musical bar, not mid-word.
- Voice-note clip preserves the natural pause before `люблю`.
- Private clips contain no names, restaurant names, location clues or unrelated personal information.
- If actual stickers replace the CSS symbols, their background is clean and they do not look like pasted screenshots.

## Failure-mode tests
- Load with `assets/audio/winter.mp3` absent: procedural fallback still plays.
- Load with `assets/audio/love-voice.m4a` absent: scene still lands visually.
- Toggle mute during winter scene.
- Switch apps during the voice-note scene, return and resume.
- Replay from epilogue: scene animations restart, progress resets, old audio is stopped.

## Privacy
- Repository should be Private before real private audio is committed.
- Deployed page keeps `noindex` and `X-Robots-Tag` headers.
- Do not add analytics unless there is a specific reason; this gift does not need tracking.
