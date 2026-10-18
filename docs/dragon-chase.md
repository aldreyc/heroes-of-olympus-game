# Festus chase and return — 18 October 2026

The camp discovery now leads into a playable 52-second chase. Leo runs automatically. The player jumps low fire using **W / Up / Space** and ducks high fire by holding **S / Down**. Labeled on-screen controls support pointer, touch and keyboard activation. **Escape** or the pause button pauses the chase; focus loss and a hidden tab pause it automatically. Retry restores the full lead. **Skip chase** allows previewing the following scenes.

The objective is the vat of **Tabasco and motor oil**, following the user's correction. There is no vanilla in the game objective, text or artwork prompts. The twelve fire attacks have distinct height warnings and nearly one second between warning and arrival. Simulated players reacting immediately, after 200 ms, or after 650 ms can complete all twelve dodges. Missing an attack loses one step of lead; the sixth stumble allows Festus to catch up. Every projectile resolves once. A well-timed jump fully above an upper flame also clears it.

Leo's fire resistance is retained: this is a chase with setbacks, not burn damage. [The publisher's sample of The Dark Prophecy, page 6](https://cdn.penguin.co.uk/dam-assets/books/9780141363967/9780141363967-sample.pdf) explicitly establishes that Leo withstands Festus's fire. [Read Riordan's Leo article](https://www.readriordan.com/2021/03/05/leo-valdezs-top-5-enchanted-tools/) supports the bronze dragon hiding in the woods and Leo later restoring him. The chase mechanics, immediate calming and direct flight home are the user's condensed game sequence; the full repair/wing-building chronology is not reproduced. New story text is action captions, with no additional book quotations or new dialogue recordings.

## Animation and effects

Eight Leo poses cover four sprint phases, two low running phases, a tucked jump and a standing pose. Festus has four distinct articulated ground gait phases. Source rectangles were measured from the generated images: several Leo poses extend beyond nominal grid cells, so actual empty gaps define the frame boundaries. Per-frame offsets retain body scale and foot baselines; duck poses remain low rather than being enlarged. One small neighboring claw fragment in the dragon's final gait frame is excluded with a geometric corner mask. The original PNGs are preserved.

The chase uses a fixed-step model separated from its Canvas renderer and input lifecycle. A single distant forest keeps one moon, while an organic transparent tree layer, foreground ferns and dust scroll at different speeds. Fire has stepped colored layers, a bright core, sparks, warm glow and a trajectory from the dragon toward the warned lane. Effects have a bounded drawing budget. Reduced motion removes flying particles and stabilizes decorative movement. Existing loaded sound effects supply fire, jumps, quiet footfalls, subdued heavy dragon steps and success cues, respecting mute.

Reaching the vat leads to four story beats: Festus drinking and settling, Leo climbing through four mounting poses, a four-phase wingbeat takeoff above the woods, and the return to camp. Rider and dragon are drawn together, with hand/leg contact. On landing, the return switches to the grounded folded-wing pose. Each animated SVG keeps an explicit crop, and all animation callbacks are cancelled on scene changes.

## Access and completion

The normal path is first battle → rescue → camp → discovery → chase → calming/mounting/flight → completion. Completed saves can choose **Play dragon chase** from the title screen. The chase unlock is also persisted on first entry. The final screen provides **Replay chase**, **Replay camp**, **Replay battle** and hero selection. Skipping or completing a chase disposes its input listeners and frame callback. A late completion callback cannot restart a story that has already begun.

## Saved art and exact prompts

All six new PNGs use **built-in image_gen generation with existing identity/style references**. They are saved in `/Users/aldrey/Code/heroes-of-olympus-game/public/assets/art/`:

- `leo-chase-v1.png` — sprint, duck, jump and idle poses.
- `festus-run-v1.png` — four quadruped gait phases.
- `festus-calm-v1.png` — Leo, Festus and the vat, oil can and sauce bottle.
- `festus-mount-v1.png` — four physical climbing/mounting phases.
- `festus-flight-v1.png` — four wingbeat phases with Leo seated on the neck/shoulders.
- `chase-trees-v1.png` — transparent organic tree layer.

The exact prompts and reference files are in [chase-v1-provenance.json](../public/assets/art/chase-v1-provenance.json) and [chase-trees-v1-provenance.json](../public/assets/art/chase-trees-v1-provenance.json). Source PNGs were not raster-edited by scripts. Frame data and masks are in `src/chase-frames.ts`.

## Verification and limits

All 91 automated tests and the production build pass. Checks cover full zero-error chase simulations at three response times, jump/duck collision, one hit per attack, terminal states, retry, keyboard and touch input, blur/visibility pause, disposal, audio cues/mute, frame bounds and offsets, effect budgets, mounting/wingbeat progression, landing and reduced motion. Mocked chapter integration covers both normal progression and preview/replay/skip paths.

Offline native Canvas snapshots inspect the actual chase renderer, running/dragon frame sheets, fire effects and vat. Sharp/librsvg snapshots inspect the actual masked SVGs for calming, mounting and flight. These do not verify live DOM layout, browser audio or perceived input latency. Live browser automation remains blocked by the existing tool policy. The local development server is running; nothing was committed, pushed or deployed for this revision.
