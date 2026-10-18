# Heroes of Olympus — Olympian Games

Created by **Rodrigo Cabrera**. The title and loading screens use the Olympian Games studio mark, and character-selection/completion credits identify Rodrigo as the game creator.

A browser game built with Phaser, TypeScript, and Vite. Rodrigo's character lineup guides the pixel art. The chapter contains three selectable fighters, a timed prophecy, brief verified quotations and action captions, a Grand Canyon battle, a rescue sequence after victory, and replay/defeat paths.

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

Audio is preloaded and played through Phaser's sound manager. The first button or keyboard interaction activates sound; M or the SOUND ON / OFF button controls all audio, including active effects. Narration lowers the music and ambience automatically. Missing audio does not stop the chapter.

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

The prophecy uses one continuous ElevenLabs reading with natural pauses. The full sequence takes about 12.4 seconds, with each line synchronized to the spoken verse. Use **Skip prophecy** or Escape to go straight to the bus scene. Skipping stops the voice and cancels all remaining prophecy timers. The sound toggle remains available during the prophecy.

## Online preview

The game now continues after the first battle into Camp Half-Blood: claiming signs, Drew's cabin tour, and Leo's walk through the woods to discover Festus. Completed saves can choose **Continue at camp** from the title screen; **Replay camp** is available at the end. This continuation is included in the production release. Scene details, artwork prompts and verification are in [docs/camp-revision.md](docs/camp-revision.md).

To preview the story without fighting, choose **Skip battle** beside the battle settings, or from the pause menu. This continues with the rescue and journey to camp. The existing **Skip scene** button can also skip the rescue sequence to reach camp immediately.

After finding Festus, play a **52-second dragon chase**: Leo runs automatically; **W / Up / Space** jumps low fire and **hold S / Down** ducks high fire. Touch controls are labeled on-screen. Escape pauses, and losing your lead offers a retry. Reach the vat of **Tabasco and motor oil** to calm Festus, mount him and fly back to camp. Completed saves can choose **Play dragon chase** from the title screen. This addition is included in production; [chase details, artwork prompts and verification](docs/dragon-chase.md) are recorded.

Play at https://heroes-of-olympus-game.vercel.app. The Vercel project is `heroes-of-olympus-game` in `aldreys-projects`; login protection is disabled. This short alias points to the current preview. When publishing a new preview, move the alias to the ready deployment with `vercel alias set <deployment-url> heroes-of-olympus-game.vercel.app --scope aldreys-projects`.

The playable hero has 3,600 health versus the wind spirit’s 3,200, making missed blocks and jumps much more forgiving.

Jason now has stronger quick, heavy and special attacks for a shorter, easier fight: a full simulated win takes approximately 102 seconds. Piper and Leo retain the earlier two-to-three-minute pacing (123 and 177 seconds in the same simulation). Actual timing depends on play.

Quick strikes build spirit. Jump low gusts, block sweeping gusts and charges, then counterattack during recovery. Piper's special stuns; Jason has stronger sword and lightning attacks; Leo's gadget burst deals bonus damage.

A guard started within 180ms of impact prevents chip damage and grants extra spirit. Each enemy recovery window rewards one counterattack with +5 damage and +8 spirit. A connected quick attack can flow into a heavy, and a connected heavy into a special: press J → K → L as each strike connects. Specials still cost 50 spirit. The storm intensifies in the second half of the fight, with slightly shorter pauses between enemy attacks and the same readable warnings.

Combat has layered dust, paper debris, ground warnings, an illustrated wind spirit with animated wisps, distinct hero specials, impact rings, brief hit pauses, a chain indicator, and delayed damage trails. Reduced-motion preferences lower debris and disable camera shake and looping story papers. Effects and callouts freeze when paused; the final hit gets a short finish before the ending.

## Content and assets

- `src/main.ts`: menus, prophecy timing, chapter flow, HUD, input UI
- `src/battle.ts`: fixed-step combat, enemy patterns, frame animation and effects
- `src/combat-vfx.ts`: layered storm, wind warnings, spirit wisps and hero effects
- `src/story.ts`: short verified dialogue, action captions and cinematic beats
- `src/story-tableau.ts`: animated 2D story staging
- `docs/story-revision.md`: sources, adaptations and local verification
- `src/audio.ts`: narration, music, ambience and effect mixing
- `public/assets/art`: generated art and measured sprite atlases
- `public/assets/art/combat-v2-provenance.json`: prompts for the new spirit and isolated strike sprites
- `public/assets/audio/audio-manifest.json`: ElevenLabs generation records, scripts, and mix notes
- `docs/canon-notes.md`: sources and explicit gameplay adaptations

The museum/skywalk arena, single opponent, and all-three-heroes selection are game adaptations. The chapter's outcome protects the trio while the wind spirit takes Hedge away. Piper uses Hedge's borrowed club; Leo uses tools and a gadget.

## Verification

### New local crash and Midas chapter

The mansion approach continues into the crash explosion, Leo kneeling beside the intact damaged Festus, a voiced Hephaestus visit and ascent with the dragon, and a Jason-only King Midas fight after Piper and Leo turn to gold. Each unblocked gold hit visibly spreads the curse; the tenth makes Jason fully gold. Block high shots and jump low pieces. Existing completed/mansion saves can use **Play Crash & King Midas** on the local title screen. This addition is included in the production release. See [chapter details, asset records and verification](docs/midas-chapter.md).

### New local flight continuation

After Coach Hedge’s rescue, the four leave on Festus, share a brief moment of relief, and are struck by a blue beam that sends them descending toward a mansion. Use **Play New Flight Scene** from the local title screen on an existing quest save. This addition is included in the production release. See [flight notes and artwork records](docs/mansion-flight.md).

### Quest chapter

After Leo returns on Festus, Chiron selects the trio, Rachel delivers a voiced Oracle reading, and the heroes depart together toward the horizon. They enter Medea's enchanted mall while Festus waits outside, then fight her potion and charmspeak attacks. **Q / Piper · Rally** breaks enchantment and stuns Medea. Existing camp/completed saves can use **Continue the Quest** from the title screen. This chapter is included in the production release. See [the chapter notes](docs/quest-chapter.md) for controls, sources, artwork prompts and verification limits.

```sh
npm test
npm run build
```

Unit tests exercise actual combat state transitions (hit once per swing, meter consumption, gravity/landing, story interruption, victory, defeat), damage/defense rules, and audio mixing/lifecycle behavior with a mocked sound manager. They do not replace browser playtesting. Browser verification is tracked separately in `docs/verification.md`.
