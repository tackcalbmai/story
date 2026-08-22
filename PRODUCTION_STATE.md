# Production state — Between Stations

Updated: 2026-08-22

## Product

`Между станциями` fully replaces the old `Нулевой адрес / Комната 0` concept.

Current public-facing workprint mechanic:

`boarding → bag → found recorder → STOP / REW / PLAY → sound reconstruction → voice match → safety choice`

The final product remains a smartphone-first interactive cinematic story. The current workprint is only the first playable fragment, not the final narrative cut.

## Non-negotiable creative rules

- grounded realism; no sci-fi or supernatural rules;
- Ukraine ↔ Latvia are the only geographic labels used in the story layer;
- no exact addresses, route numbers, restaurant names, maps, flags or identifying location clues;
- player performs physical/tactile actions instead of tapping through static slides;
- sound can carry clues, but every important sound must have a non-spoiling subtitle equivalent;
- one stable carriage geometry; no impossible door/location changes;
- safety-first logic: the heroine moves toward the conductor / other people and 112 before pursuing the full mystery;
- personal relationship references must serve the plot rather than appear as a checklist of Easter eggs;
- website UI, interactions, transitions and motion are built in code; generated art is the scene/asset layer only.

## Visual system

CreativeClaw theme: `Between Stations`

Direction:

- premium graphite + ink sketch;
- expressive fine pencil linework;
- elegant textured cross-hatching;
- restrained cool blue-grey / graphite palette;
- sparse warm highlights;
- subtle paper grain;
- cinematic, adult, grounded composition;
- avoid photorealistic AI sheen, cartoon exaggeration, thick comic outlines, speech bubbles and text baked into scene art.

### Saved Characters

- Female lead — CreativeClaw Character ID: `59e0595e-2a0e-4d4e-a622-8df83b6894bf`
  - petite adult woman, dark hair, green eyes, compact build;
  - neutral travel/off-duty wardrobe in the reference sheet;
  - small chest tattoo remains consistent and only appears naturally when visible;
  - do not repeatedly dress her in white / medical-looking clothing.

- Male lead — CreativeClaw Character ID: `e3e0443a-899a-4d5f-b155-8cd4c16c3cac`
  - taller adult man, dark-brown hair, grey-blue eyes;
  - neutral everyday wardrobe;
  - no military/tactical styling unless a future scene explicitly requires it.

Reference sheets are consistency anchors, not final scene artwork.

## Current CreativeClaw production assets

- train background: `https://cdn.creativeclaw.co/u/ce56d390/images/11c80fff-5ec1-4139-9151-2d3688d10bc2.png`
- work bag: `https://cdn.creativeclaw.co/u/ce56d390/images/8c0a0b44-a788-4c64-872c-dd662c7df9db.png`
- digital recorder: `https://cdn.creativeclaw.co/u/ce56d390/images/8df5dfd5-0375-494b-99f0-2541540d4b46.png`
- temporary recorder owner voice: `https://cdn.creativeclaw.co/u/ce56d390/audio/ca1d9628-d2c3-4a59-87e5-39e0bee3af5b.mp3`
- temporary recorded male voice: `https://cdn.creativeclaw.co/u/ce56d390/audio/21becc01-5f79-473d-bdb0-fe5561d05ad0.mp3`
- temporary live male voice: `https://cdn.creativeclaw.co/u/ce56d390/audio/60bd1d81-7afb-4656-993e-da78ef7bdd5c.mp3`
- workprint OG image: `https://cdn.creativeclaw.co/u/ce56d390/images/444f8320-cd9d-4125-967b-775d43960424.png`

## Supabase

Project: `Story`
Project ref: `bosjlvrsgayngbcnzjzk`

Current backend is intentionally small:

- table: `public.story_playtest_events`
- RLS forced on;
- public roles cannot read/write the table directly;
- Edge Function: `story-playtest`;
- only anonymous, content-free interaction telemetry is stored;
- no private dialogue, voice data, identifying locations or personal media are stored in telemetry.

Current client endpoint:

`https://bosjlvrsgayngbcnzjzk.supabase.co/functions/v1/story-playtest`

## GitHub / deployment

Repository: `tackcalbmai/story`
Default branch: `main`

Vercel project: `story`
Project ID: `prj_pL3miI0YaQpKptHRvmSHFIXnjImg`
Team: `VicxorLev`
Team ID: `team_QqUXys63I0d60KdfpH4kPqdB`

Current Vercel production build is connected to `main`, but Vercel deployment protection currently redirects the normal Vercel domain through SSO. Do not describe that URL as publicly accessible until protection is actually removed or a separate public host is used.

The previous ChatGPT Sites address (`komnata-zero.victor-lev.chatgpt.site`) is a separate publishing surface and is not automatically updated by GitHub/Vercel changes.

## Recovered preproduction facts

The prior preproduction pass produced a full realistic screenplay version with:

- 19 scenes;
- approximately 18–19 minutes runtime;
- 111 dialogue lines;
- 15 interactions;
- night train / found physical recorder mystery;
- separate audits for causality, character knowledge, safety and dialogue;
- a grey blocking test for carriage geometry, one-door logic, sound clues and `STOP / REW / PLAY`.

The original `SCREENPLAY_V1.md`, `SCREENPLAY_AUDIT_V1.md` and `BLOCKING_TEST_REPORT_V1.md` are no longer present on `main`, and the previously referenced short commit SHAs are not resolvable from the current repository history. Do not invent their missing detailed scene text. Reconstruct only from verified material or explicitly rewrite a new version.

## Next production gate

Before spending more generation credits on final art/video:

1. treat the current recorder sequence as the interaction benchmark;
2. lock the next screenplay section in text/code first;
3. use the saved Characters for any new character-driven image/video generation;
4. generate only scene-specific reference frames that are needed by the playable build;
5. keep expensive video generation for selected 4–8 second dramatic beats after storyboard approval.
