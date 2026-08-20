# story

Cinematic birthday gift: interactive web short + motion-comic language. Current cut: ~3:20 plus the entry gate and birthday epilogue.

## Run
Static HTML/CSS/JS. No framework and no build step.

### Cloudflare Pages
- Framework: `None`
- Build command: empty
- Output directory: `/`

### Vercel
`vercel.json` already contains privacy-oriented response headers. Connect the repository and deploy as a static project.

### GitHub Pages fallback
`.github/workflows/pages.yml` is ready. In repository **Settings → Pages**, choose **GitHub Actions** as the source; the workflow can then publish the current `main` branch.

## Optional personal audio
When available, add:
- `assets/audio/winter.mp3` — «Вечная зима»
- `assets/audio/love-voice.m4a` — short original voice-note fragment with the first «люблю»

The story works without them and falls back to a procedural Web Audio soundscape.

## Directing/debug mode
Open the deployed URL with `?debug=1` to reveal scene/time controls for review.

Production notes:
- `DIRECTING.md` — dramatic and visual rules
- `STORYBOARD.md` — timed beat board
- `ASSETS.md` — only personal media worth replacing
- `QA.md` — release checklist

## Privacy
The page is `noindex`, but the repository is currently public. Before committing real private audio, make the repository **Private** if you do not want the source/materials publicly accessible.
