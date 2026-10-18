# Heroes of Olympus — Rodrigo's opening chapter

A browser game built with Phaser, TypeScript, and Vite. Rodrigo's character lineup guides the pixel art. The chapter contains three selectable fighters, a timed prophecy, original dialogue, narrated opening and ending, a Grand Canyon battle, a mid-fight rescue, and replay/defeat paths.

## Run

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. For a production build:

```sh
npm run build
npm run preview
```

The `dist` directory is a static deployable website. No server API, credentials, or ElevenLabs subscription is required to play. The generated audio is bundled locally.

Audio is preloaded and played through Phaser's sound manager. The first button or keyboard interaction activates sound; M or the music-note button controls all audio, including active effects. Narration lowers the music and ambience automatically. Missing audio does not stop the chapter.

## Controls

- A / D or left/right arrows: move
- W, up arrow, or Space: jump
- S, down arrow, or Shift: hold block
- J: quick attack
- K: strong attack
- L: special, spending 50 spirit
- Escape: skip the prophecy; pause/resume during combat
- M: mute/unmute (the labeled SOUND ON / SOUND OFF button shows the current state)
- Keyboard button in the fight toolbar: show/hide on-screen controls

On touch devices the on-screen controls appear automatically. Use two fingers to move and attack together. Landscape is recommended for the largest arena.

The prophecy has four recorded ElevenLabs voice lines timed to their text. Use **Skip prophecy** or Escape to go straight to the bus scene. Skipping stops the voice and cancels all remaining prophecy timers. The sound toggle remains available during the prophecy.

Quick strikes build spirit. Jump low gusts, block sweeping gusts and charges, then counterattack during recovery. Piper's special stuns; Jason has stronger heavy sword strikes; Leo has the strongest gadget burst.

## Content and assets

- `src/main.ts`: menus, prophecy timing, chapter flow, HUD, input UI
- `src/battle.ts`: fixed-step combat, enemy patterns, frame animation and effects
- `src/story.ts`: original dialogue and cinematic beats
- `src/audio.ts`: narration, music, ambience and effect mixing
- `public/assets/art`: generated art and measured sprite atlases
- `public/assets/audio/audio-manifest.json`: ElevenLabs generation records, scripts, and mix notes
- `docs/canon-notes.md`: sources and explicit gameplay adaptations

The museum/skywalk arena, single opponent, and all-three-heroes selection are game adaptations. The chapter's outcome protects the trio while the wind spirit takes Hedge away. Piper uses Hedge's borrowed club; Leo uses tools and a gadget.

## Verification

```sh
npm test
npm run build
```

Unit tests exercise actual combat state transitions (hit once per swing, meter consumption, gravity/landing, story interruption, victory, defeat), damage/defense rules, and audio mixing/lifecycle behavior with a mocked sound manager. They do not replace browser playtesting. Browser verification is tracked separately in `docs/verification.md`.
