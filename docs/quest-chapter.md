# Chiron, the Oracle, and Medea — local chapter extension

The existing dragon return now continues into Chiron selecting Jason, Piper, and Leo; Rachel's voiced prophecy; the quest reveal; the trio's flight on Festus; a mall landing and walking entrance; and a playable Medea encounter. Festus stays outside. Medea’s defeat now reveals a smaller gold mechanical dragon. After it is weakened to one third health, Festus breaks through a window and finishes it with fire; only then is Hedge freed. Hera’s rescue remains ahead. See [the golden guardian revision](golden-dragon.md).

## Story treatment and sources

This is Rodrigo's condensed route, following his requested order. It jumps directly from camp to the mall, omitting intermediate book encounters. Chiron's briefing and all explanatory scenes are action captions, not fabricated quotations attributed to the characters. The four prophecy lines come from the user-supplied original build brief and the existing `public/assets/prophecy.json`.

- [Rick Riordan: Rachel Elizabeth Dare](https://rickriordan.com/character/rachel-elizabeth-dare/) identifies Rachel as a mortal host of the Oracle of Delphi.
- [Publisher: The Lost Hero](https://www.readriordan.com/book/the-lost-hero/feed/) describes the red-haired Oracle, Hera's imprisonment, the three quest members, and their departure on Festus.
- [Author: Camp map](https://rickriordan.com/extra/a-map-of-camp/) places Chiron at the Big House.
- [Publisher: Demigod Near-Death Stats](https://www.readriordan.com/2020/01/24/near-death-stats/) confirms the trio's Medea encounter and Jason/Leo being influenced by her magic. The playable potion patterns, ward, Rally cooldown and health values are game mechanics.

## Local testing

Open the local Vite preview and use **Continue the Quest** on an existing camp or completed save. The extension also follows the dragon return naturally. Story Next/Space continues each beat. Rachel's prophecy has Next/Skip and Escape. Skip Scene advances to the next sequence. After the quest briefing and journey, the Medea battle begins. Existing battle skip, pause and retry controls apply to this encounter too. Completion offers Replay Quest and Fight Medea.

Medea uses rolling potions (jump), crystal fans (block), and charmspeak (block or rally). Enchantment above 60% weakens attacks. **Q / Piper · Rally** clears enchantment, grants spirit and a small heal, and stuns Medea for three seconds; its cooldown is eight seconds and freezes during pause. Piper's special also clears enchantment. The hero has 3,600 health; Medea's enchantment has 1,900. The approved first canyon fight retains its original rules.

## Artwork and voice

Five new PNG assets live under `public/assets/art/`: `quest-cast-v1.png`, `medea-combat-v1.png`, `festus-trio-flight-v1.png`, `medea-mall-exterior-v1.png`, and `medea-mall-arena-v1.png`. All were generated with the built-in image tool. Exact prompts, reference files, original output paths and transparency settings are in `public/assets/art/quest-v1-provenance.json`.

All three riders are included in the new flight artwork. Only the two clean upper wing phases are consumed; the lower generated cells touch and are unused. Source crops are explicitly clipped. Mall walkers use the existing four-phase walking sheet and stop at the entrance. The parked dragon's crop aligns its feet with the plaza.

Rachel's 13.92-second reading uses the connected ElevenLabs plugin, Emily E. voice, model eleven_v4. It plays once over the four supplied prophecy lines. The selected take and prompt are recorded in `public/assets/audio/rachel-prophecy-provenance.json`; the local audio file is `rachel-prophecy.mp3`. Voice respects the master sound toggle, ducks the music, and stops when the scene advances or is skipped.

## Verification

116 automated checks pass after the golden guardian revision, including the complete chapter flow, existing-save shortcut, Medea pause/retry/skip routing, three full simulated hero victories, enchantment/ward/rally behavior, asset bounds, walking gait, cinematic disposal and finite spell geometry. TypeScript and the production build pass. Native Canvas/Sharp studies inspect the actual cropped SVG assets and spell-drawing functions for Chiron, Rachel, mall staging, trio flight and Medea combat. These are offline visual studies, not browser screenshots.

Interactive browser testing remains unverified because the browser tool's saved policy denies this local preview. No alternate browser, CDP, or network route was used to bypass that restriction. The existing local server remains on port 5173. No commit, push, or deployment was made.
