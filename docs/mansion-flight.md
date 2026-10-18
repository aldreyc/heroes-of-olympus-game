# Relief, blue strike and mansion approach — local addition

After the golden guardian falls and Coach Hedge is freed, the story now continues through five beats: the four travelers settling onto Festus outside the mall, a quiet flight above winter hills, a large blue beam striking his wing, a damaged descent through clouds, and a mansion appearing below. This flight segment ends on the approach and now leads into the separately requested [crash and Midas chapter](midas-chapter.md). The source of the blue attack remains unnamed. New text is descriptive action captioning, with no invented book quotations.

Coach Hedge remains aboard alongside Jason, Piper and Leo in every pose. The new sheet includes a grounded seated pose, two wing phases, and a damaged pose with a sagging mechanical wing. Explicit clips exclude neighboring sheet cells. Frame scale and offsets normalize the different source poses. The departure has a ground shadow that fades at takeoff.

The scene clock triggers the beam at 2.4 seconds, switches to the damaged pose, shows sparks, stops the wing loop, then tips Festus downward with trailing smoke. Healthy wingbeats cannot resume during the descent. Wind replaces combat music for the relief scene; gust, lightning and impact cues accompany departure and the hit. Skipping cancels the animation and delayed sound cues. Reduced motion uses stable poses and avoids the beam flash, rapid descent, wing loop and moving foreground effects.

## Preview

Refresh the local preview at `http://localhost:5173/`. Existing quest/completed saves have **Play New Flight Scene** on the title screen. The scene also follows the golden dragon rescue naturally. Completion after the Midas chapter offers **Replay Flight**. Next/Space advances a beat; Skip Scene moves from the flight into the crash sequence.

This addition remains local. The previously deployed game was not redeployed.

## Artwork records

The built-in image-generation tool created:

- `public/assets/art/festus-escape-party-v1.png`
- `public/assets/art/mansion-approach-sky-v1.png`
- `public/assets/art/mansion-grounds-v1.png`

Exact prompts, reference inputs, transparency settings and original output paths are in `public/assets/art/mansion-v1-provenance.json`. The blue beam, impact sparks, smoke and foreground clouds are code effects. The mansion is a private stone-and-timber house with a snowy forecourt.

## Verification

122 automated tests and the TypeScript/production build pass. New checks cover scene order, all four travelers in the narrative, healthy/damaged timing, one-way wing failure, falling and shrinking positions, reduced motion, actual image and clip dimensions, scale changes during frame switching, cancellation, delayed-cue disposal and both direct preview/replay and full chapter flow.

Native Canvas/Sharp studies inspect the actual SVG source crops and scene-clock positions for departure, relief, impact, descent and mansion reveal, including the wing/beam alignment and complete rider grouping. These are offline visual studies, not live browser screenshots. Interactive browser verification remains pending under the saved browser permission restriction. No commit, push or deployment was made for this addition.
