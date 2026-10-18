# Verification record

## Jason weapon correction — 18 October 2026

The user's report was confirmed in the original Jason idle artwork: his raised free hand held an erroneous second blade. Checked the publisher's Jason profile (linked in `canon-notes.md`) and all active combat poses. Replaced only the idle art with a single-sword frame, including the story sword reveal that uses the same pose. Preserved its on-screen height and foot anchor. Generated with the built-in image tool; prompt and source recorded in `public/assets/art/jason-idle-v2-provenance.json`. Visually inspected the new asset; checked transparent alpha and atlas bounds. All 51 existing automated checks and the build passed. Live browser verification remains pending under the existing permission block.

## Storm and combat polish — 18 October 2026

- Replaced the procedural spirit body with a detailed transparent pixel-art sprite, retaining animated wisps and orbiting debris. Enemy effects remain wind-only. Added layered haze, moving dust and papers, ground warnings, distinct Jason/Piper/Leo specials, impact bursts and a short finishing beat.
- An offline rendering study exposed neighboring-pose fragments inside the old Jason/Piper quick-attack rectangles. Generated a separate, padded three-character strike atlas; inspected the replacement in the same offline composition and confirmed the extra feet are absent. PNG alpha and atlas bounds inspected. No original image was altered; new files are versioned siblings. Prompts and provenance are in `public/assets/art/combat-v2-provenance.json`.
- Added perfect guards, one counter bonus per recovery window, quick → heavy → special chaining, a persistent Piper stagger state, a slightly faster second phase after the rescue, and bounded enemy movement. Wind volume increases in the second phase while narration still ducks it.
- Improved health damage trails, special-ready feedback, spirit threshold indicator, chain countdown, touch hints, and end-of-chapter counter/guard statistics. Dialogue portraits now use the isolated character assets. Added wind-driven papers and a sword-reveal aura to the story.
- **51 automated checks pass**, including the new mechanics, effect budgets, finite drawing commands, reduced-motion behavior, pause/finish lifecycle, atlas separation, narration ducking under stronger wind, and full simulated battles for all three heroes. TypeScript and Vite build pass.
- Inspected static offline art studies rendered directly from the local graphics functions and assets with a native canvas adapter. These are composition checks only: no page was opened, no network used, and no browser restriction bypassed. They do not verify Phaser rendering, DOM layout, actual audio, input latency, or live gameplay. Browser testing remains pending.

## Latest playback revision

The user asked for a faster, more natural prophecy. It now uses one continuous 11.68-second ElevenLabs narration rather than four isolated voice clips. Scribe transcription confirmed the supplied wording and provided line starts at 0, 3.08, 6.32, and 8.96 seconds. Fades are 160ms; total sequence is approximately 12.4 seconds instead of 24.65 seconds. Tests verify a single uninterrupted voice, line timing, completion after the recording, and skip/cancel behavior. The latest request supersedes the original four-second fixed hold per line. The public short alias is `heroes-of-olympus-game.vercel.app`.

## Completed

- TypeScript and Vite production build passed.
- Thirty-five automated tests passed: attack collision timing across the active swing and recovery window, special meter, jump and landing, one-time rescue trigger, victory, defeat, low gust evasion, blocking, unique hero damage, bounded combo bonus, asset/frame validation, prophecy integrity, pause behavior, clean restart state, keyboard isolation between menus and combat, complete simulated battles with all three heroes, audio behavior, and prophecy timing/cancellation.
- User-requested prophecy changes: a visible Skip prophecy button and Escape go directly to the bus scene, stopping voice and cancelling pending timers. Four ElevenLabs recordings use the existing Daniel narrator, one per line, during each four-second fully-visible hold. All four MP3s decode successfully and run 2.80–3.36 seconds. Four new tests verify full timing, early skip, skip during narration, and cancellation when leaving the scene; these are timer simulations, not live browser tests.
- Replaced the ambiguous music-note toggle with explicit SOUND ON / SOUND OFF text, a speaker/speaker-with-cross icon, distinct state colors, and accessible pressed state. The toggle is available during the prophecy, retains keyboard focus after activation, and M ignores held-key repeats. Combat settings were moved below the HUD to accommodate the wider label.
- Fixed replay state reset so a fresh fight does not inherit combo, attack timing, facing direction, or buffered input timing.
- Fixed premature miss detection: a target entering attack range while a swing remains active can be hit, but recovery frames cannot deal damage.
- Scoped combat key interception to battles so Space retains native button activation in menus. On-screen attack buttons now accept keyboard activation, hold buttons release on keyup/focus loss, and touch input reduces the control hints.
- Cleared the battle-start banner during the story reveal, froze particle movement while paused, and removed residual particles when returning to menus.
- Centered the title and Play button as specified and moved the dedication away from the settings buttons. These layout changes still require visual verification.
- A user screenshot confirmed neighboring characters leaked into each character-selection card. Replaced shared lineup background offsets with three independent transparent portraits, one per hero, preserving the supplied designs. Visually inspected each generated portrait; all are 1254 × 1254 PNGs with alpha. Confirmed all three are included in the production build. Updated the cards with consistent image fitting and subtle individual background colors. The updated selection screen still needs a live browser view.
- Combat simulations use mocked rendering and input; they do not verify browser rendering or real keyboard/touch behavior.
- Audio generation completed; assets decoded successfully with ffmpeg/ffprobe.
- Audio now uses Phaser's sound manager and asset preloader instead of separate HTML audio elements. Tests verify input-driven context resumption, persisted/master mute, suppression of effects while muted, narration mixing and disposal, music pause/resume without duplication, ambience replacement, missing-asset handling, and bundled file paths. Audio tests use a mocked sound manager and do not prove browser audibility or timing.
- Character atlas transparency and source frame rectangles inspected.
- Opening canon reviewed against author/publisher material and attributed excerpt; adaptations recorded in canon-notes.md.

## Pending browser verification

The in-app browser permission gate denied localhost:5173, including after chat approval, the user changing the saved permission, and a reported app restart. The local configuration explicitly contains `access = "allow"` for `http://localhost:5173`; no conflicting rule was found in the inspected configuration files. The tool still reports a saved permission or managed-policy denial. The cause remains unconfirmed. No alternate browser automation was used to bypass that denial.

The development server was restarted on port 5173 for the user's manual preview. Browser verification remains pending and the game is not yet verified ready for delivery.

The user subsequently supplied a screenshot showing both the default and exact `http://localhost:5173` Browsing permissions as **Always allow**. A retry after the suggested exception reset still returned the same saved-permission/managed-policy denial before navigation. The visible setting and effective tool policy disagree; the underlying cause is not established. App support investigation is the next diagnostic step. The latest audit found the dev server stopped and restarted it on the same port for manual preview.

Once access is allowed, verify:

1. Title → book → all three character choices, keyboard and mouse.
2. Four prophecy lines synchronized to the single natural reading, approximately 12.4 seconds total, Skip prophecy/Escape, and explicit SOUND ON/OFF control. Later user requests supersede the original fixed holds and black-screen-only controls requirement.
3. Opening bus art, original dialogue, narrator, museum reveal, Jason sword transformation for every selected hero.
4. Keyboard and on-screen movement/jump/block/quick/strong/special; correct attack damage and visible feedback.
5. Wind spirit low/sweep/charge warnings, evasion, block and counterattack.
6. Mid-fight rescue resumes without resetting health.
7. Victory ending, defeat, restart, change character, and replay.
8. Mute, focus loss pause, fullscreen and responsive portrait/landscape layouts.
9. Asset loads and console errors, visual clipping and animation alignment.
10. New Phaser audio integration: first Play gesture, intro after prophecy, scene skips, mute during a sound effect, music resume, and sound after returning from another tab. Compare narration/dialogue timing by listening.
11. New spirit and strike sprites, attack/impact alignment, floor warnings, perfect guards, combo timing, counter feedback, damage trails, second-phase storm, reduced-motion behavior, and the brief finish before the ending. Check desktop and narrow touch layouts.

Rodrigo's playtest feedback is not yet available. Satisfaction is not claimed.

## Brief completion audit

| Requirement | Current evidence | Remaining proof |
| --- | --- | --- |
| Title → book → Jason/Piper/Leo selection | Menu and selection handlers in `src/main.ts`; individual portraits derived from the supplied lineup in `public/assets/art/portraits` | Live keyboard, pointer, focus, selection persistence, and updated card framing checks |
| Four-line narrated prophecy on black | Exact text verified against supplied brief; continuous 11.68-second recording and synchronized text cues | Observe natural pacing, fades, skip/mute and final bus transition |
| Bus and Grand Canyon story | Local bus/canyon/museum art, original dialogue, intro narration, bus/wind ambience | Rendered framing, readable text, motion, audio playback and timing |
| Dark wind spirit with a visible face and no electricity | Smoke/face drawing and wind-only enemy effects in `src/battle.ts` | Visual quality and attack readability |
| Jason coin → golden sword for every hero selection | Story stages explicitly use Jason; coin/sword presentation and cue implemented | Visual continuity, hand placement, transformation and immediate handoff |
| Three playable heroes and responsive fight | Complete simulated win for each hero; tested collision, defense, meter, victory and defeat | Real controls, animation alignment, touch interaction and perceived responsiveness |
| Mid-fight rescue and Hedge's disappearance | Rescue art/dialogue; interruption fires once and preserves health in simulation | Full scene/resume flow and visual story clarity |
| Aftermath and replay/character selection | Ending dialogue/narration and completion handlers; clean replay state tested | End-to-end win, loss, restart and menu flow |
| Polished full chapter on laptop and narrow screen | Production build and local assets pass automated checks; responsive CSS present | Browser console/assets, clipping, sound/mute, focus-loss pause, fullscreen and visual playthrough |
| Prepared for Rodrigo and incorporates available feedback | Personalized intro, dedication, reference art, and local preview | Rodrigo's playtest and response to any feedback |

The previous goal turn made concrete progress (replay fix and additional combat simulations). This audit also produced functional input and collision fixes. Browser denial remains the same unresolved external blocker; no completion claim is supported yet.

The subsequent portrait-feedback turn made concrete progress by replacing shared lineup crops. The audio review also made concrete progress: it found an empty audio initializer and mute that excluded active one-shot effects, migrated playback to the existing Phaser sound manager, and added nine audio checks. Phaser's installed sound-manager sources were inspected for unlock, global mute, and one-shot disposal. User-gesture initialization follows [MDN's Web Audio guidance](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices#autoplay_policy).
