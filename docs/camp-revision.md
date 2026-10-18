# Camp Half-Blood continuation — 18 October 2026

After the Grand Canyon ending, the story continues through chariot touchdown, the three parent signs, Drew's tour, separate visits to Jason's, Piper's and Leo's cabins, and Leo's moonlit forest walk and discovery of Festus. The latest follow-up continues into a playable dragon chase, Tabasco-and-motor-oil calming, mounting and flight back to camp; see [dragon-chase.md](dragon-chase.md). The earlier verification notes below describe the initial camp revision.

The simultaneous claiming at arrival and Drew escorting all three are Rodrigo's requested condensed adaptation. They are not presented as the novel's exact chronology. Lightning, dove and flaming hammer are the game's visual parent emblems. New text consists entirely of action captions, with no invented speech or additional book quotations. The Zeus cabin caption retains Jason's Roman identification of his father as Jupiter.

[Read Riordan's Leo article](https://www.readriordan.com/2021/03/05/leo-valdezs-top-5-enchanted-tools/) confirms Festus is the bronze dragon who hid in the woods and that Leo later repairs him. [Read Riordan's Piper profile](https://www.readriordan.com/2018/03/15/5-reasons-you-love-piper-mclean/) identifies the trio's divine parents. The art is an original game interpretation, not an illustration from the books.

## Walking and presentation

The new transparent sheet has four unarmed walking phases for each of Jason, Piper, Leo and Drew: alternating contact and passing poses, with opposite arm swings. Measured frame windows preserve body scale, head alignment and sole contact; no neighboring sprite leaks into a frame. Gait follows distance travelled, stops at the destination, and is cancelled whenever the scene changes. Cabin approaches gradually reduce scale and move the foot baseline toward the doors to convey depth. The forest walk retains a level ground baseline. Reduced motion uses each destination's stable pose without running the animation loop.

The claiming signs appear above the heads in sequence with light and sound cues. Camp/forest fireflies, dusk-to-night art, the chariot's landing and a gradual dragon reveal support the new scenes. Quiet footfalls reuse the existing landing recording at a lower volume; existing music and mute settings are retained. No new dialogue recordings were generated.

Victory unlocks **Continue at camp** on the title screen. Previous completed saves also qualify. The final screen offers **Replay camp**, **Replay battle**, and hero selection. Skipping the canyon ending proceeds to camp; skipping camp proceeds to the final screen and clears motion and pending cues.

## Saved artwork and prompts

All artwork was produced using the **built-in image_gen tool**. Files are saved under `/Users/aldrey/Code/heroes-of-olympus-game/public/assets/art/`:

- `camp-half-blood-v1.png` — sunset camp and cabins background.
- `camp-woods-v2.png` — final moonlit woodland background. The earlier `camp-woods-v1.png` is preserved as its edit reference; the revision removes the unintended distant mountains and temple.
- `camp-walk-v1.png` — sixteen unarmed animation poses, with the existing story heroes used as identity reference.
- `festus-discovery-v1.png` — transparent grounded bronze dragon.
- Exact generation prompts: [camp-v1-provenance.json](../public/assets/art/camp-v1-provenance.json).
- Exact forest-edit prompt: [camp-woods-v2-provenance.json](../public/assets/art/camp-woods-v2-provenance.json).

No source image was raster-edited by a script; alpha measurement only determines SVG viewports. Offline native-canvas studies inspect the sprite phases, soles, scale and dragon/camp compositions. These studies do not verify browser layout or animation.

## Verification

### Sprite crop and battle-skip follow-up

The user reported neighboring character fragments during the camp arrival. The full-sheet SVG images were only constrained by `viewBox` and `preserveAspectRatio="meet"`. Space around a fitted character could still expose adjacent artwork. Earlier native-canvas studies cropped source rectangles directly, so they missed this SVG-specific behavior.

`src/sprite-svg.ts` now applies an explicit image clip in normalized frame coordinates, with a unique clip identifier for every sprite instance. Standing actors, walking actors, chariots and other cropped props all use it. Walking advances the source image offsets inside a fixed mask instead of moving the viewport. Original artwork and frame sizes are preserved. An offline SVG raster comparison using Sharp/librsvg reproduces the original neighboring body/foot fragments and confirms their absence with the explicit clip. This does not verify live browser layout.

Added **Skip battle** to the battle toolbar and pause menu. It stops combat, clears held/buffered input and any pending result, unlocks the camp continuation, and enters the existing rescue ending. It does not add combat hits or change the current combat statistics. The rescue can be skipped separately to reach camp. All 72 automated tests and the build pass, including skip-from-battle/pause and crop/gait regressions. Changes remain local.

Automated checks cover the complete timed victory → rescue → camp → dragon → completion flow with mocked UI/timers, previous-save continuation, fresh-save menus, replay/skip cancellation, all new shot rendering and assets, constant gait scale, the four phases, reduced motion and muted footfalls. TypeScript and Vite build pass. The existing tool-level browser permission block still prevents live layout/audio/input testing. The local server remains the manual preview. Changes remain local; no push or Vercel deployment was performed.
