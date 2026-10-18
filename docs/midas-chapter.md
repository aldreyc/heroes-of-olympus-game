# Crash, Hephaestus and King Midas — local chapter

The mansion approach now continues into a large fire-and-snow landing explosion. Festus remains a single intact, heavily damaged dragon. Leo kneels beside him with a wrench while Jason, Piper and Coach Hedge watch. Hephaestus appears as a blacksmith, delivers the user's requested line, and rises into the sky carrying the entire dragon body. Leo stays on the ground.

The three heroes walk toward the mansion entrance using the existing four-phase walking animation. Hedge stays outside guarding the door. Inside, two separate small golden blasts turn Piper and Leo into gold statues. Midas enters, and Jason alone fights him in a new mansion arena. The statues remain visible behind the fighters. Victory leaves Jason beside his still-golden friends, ready for the next requested story continuation; no cure or additional book dialogue has been invented.

## Preview and controls

Refresh `http://localhost:5173/`. An existing completed or mansion save can choose **Play Crash & King Midas** on the title screen. The sequence also follows the blue strike and descent naturally. **Next / Space** advances one beat; **Skip Scene** moves to the fight. Completion offers replay options for the arrival and Midas fight.

Jason moves with A / D, jumps with W / Space, guards with S, and attacks with J / K / L. Midas has 1,500 health. Jason has ten curse-resistance points: each actual golden projectile hit adds one gold stage, and the tenth turns him fully gold and ends the fight. Each hit changes part of the current animation pose, progressing through feet, legs, arms and torso to the whole body. The HUD shows ten pips and a counter, with a warning on nine hits.

Blocking high shots adds no gold and causes no chip damage. Jump low golden pieces. Midas cycles low shots, high shots and a delayed double shot, with advance warnings. A short protection period prevents stacked hits. Swept projectile contact catches fast pieces even across a longer simulation step. Pause freezes projectiles, and retry clears all curse and projectile state. The complete gold statue is displayed before the defeat/retry menu.

## Artwork and voice records

New artwork generated with the built-in image tool:

- `public/assets/art/festus-damaged-v1.png`: damaged but intact resting dragon.
- `public/assets/art/forge-story-cast-v1.png`: isolated Hephaestus and kneeling Leo.
- `public/assets/art/king-midas-combat-v1.png`: four isolated Midas combat poses.
- `public/assets/art/midas-mansion-arena-v1.png`: mansion interior.

Exact prompts, references, transparency settings and original generated output paths are in `public/assets/art/midas-v1-provenance.json`. Measured crops are in `src/midas-frames.ts`; explicit SVG clipping excludes neighboring poses. The explosion, golden blasts, glints, spell pieces and ascension are code effects. Gold shading is applied at runtime while preserving transparency and source detail. Combat gold poses are cached at a maximum height of 384 pixels, preserving exact displayed size and foot anchoring while avoiding full-resolution copies of the large idle source.

`public/assets/audio/hephaestus-reuse.mp3` is a 5.44-second ElevenLabs reading using Gideon, model `eleven_v4`. The script is the user's supplied wording, lightly punctuated: “No machine lasts forever. Not even the best ones. But everything can be reused.” It is not presented as an independently verified book quotation. Voice, generation ID and script are recorded in `public/assets/audio/hephaestus-reuse-provenance.json`. The existing sound toggle controls the voice and effects.

## Verification

All 138 automated tests and the TypeScript/Vite production build pass. New checks exercise the real Midas combat state, exactly ten hits, blocked and jumped shots, protection, pause, retry, room bounds and a full simulated Jason victory. Model tests cover swept collisions and delayed volleys. Gold-render tests cover cumulative body coverage, alpha/shading, cached pose dimensions, origin and displayed-size preservation. Chapter integration covers the previous rescue/flight through the new story, Midas victory, defeat and replay, with timer cleanup.

Offline native Canvas/Sharp studies were inspected using the actual source assets, clipped story SVGs, runtime gold-texture function and Midas effects. These cover the repair/forge composition, intact body, gold statues, all four enemy crops, incremental Jason transformation, spell alignment and mansion combat composition. They are not live browser screenshots. Interactive browser layout, audio playback and control feel remain to be playtested under the existing saved browser restriction.

This change is local only. No commit, push or deployment was performed.
