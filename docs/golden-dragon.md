# Golden mechanical guardian — local revision

Medea's defeat now leads to one smaller mechanical dragon made of bright pure gold. It matches Festus's articulated armor and gear joints, with a compact silhouette and red eyes. Four isolated poses cover idle, stepping, fire breath and recoil. The earlier organic concept was discarded and is not included in the game.

The dragon has 1,800 health. The player fights it until exactly 600 health remains. A hit that would overshoot is capped at 600, combat input locks, and the transition fires once. Above that threshold the fight continues normally. All three heroes remain playable. The enemy uses floor fire (jump), claw attacks (guard), and a mechanical charge (guard, then counter). Leo resists the fire. The larger sprite's movement bounds keep its body and tail inside the arena.

The cinematic then shows Festus bursting through a broken window with falling shards, breathing layered fire across the gold dragon, and stopping its gears. Only afterward do Jason, Piper and Leo find and free Coach Hedge. The group regroups outside, with Hera's rescue still ahead. All new prose is action-caption adaptation of Rodrigo's request, not invented dialogue attributed to the book.

Battle skip reaches the same rescue sequence. Pause/restart preserves the selected encounter. The completion screen includes **Fight Golden Dragon** for replay. To reach the addition from an existing camp save, use **Continue the Quest**; story skip and the Medea battle skip can fast-forward to the new fight.

## Artwork

Built-in image generation produced the following local assets:

- `public/assets/art/golden-dragon-v2.png`
- `public/assets/art/festus-window-v1.png`

Exact final prompts, reference inputs, transparency settings and original output paths are recorded in `public/assets/art/golden-dragon-v2-provenance.json`. The game uses explicit clipped source bounds; neighboring sheet cells are excluded. The window, glass shards, fire, sparks and impact lighting are code effects. Reduced-motion preferences remove flying shards, repeated embers, lunging story movement and flicker.

## Verification

116 automated tests and the TypeScript/production build pass. New checks cover the exact one-third boundary, overshooting strikes, no premature rescue, one transition only, all three full simulated victories, Leo's fire resistance, large-enemy arena bounds, gold encounter retry/skip/replay, story ordering, asset viewports and finite effect geometry. Native Canvas/Sharp studies inspect the actual story SVG crops, the smaller enemy's scale, Festus's larger size, and mouth-to-fire placement.

These are offline studies and simulated controls. Interactive browser verification is still pending under the saved browser permission restriction. The local server remains available on port 5173. No commit, push, or deployment was made.
