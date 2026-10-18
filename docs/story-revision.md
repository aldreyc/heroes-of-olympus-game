# Local story revision — 18 October 2026

## Sources and quotation limits

- [Disney / Read Riordan book overview](https://www.readriordan.com/book/the-lost-hero/) confirms the amnesiac Jason, his friends, Dylan, sword, flight, Annabeth and a pegasi-drawn chariot.
- [Disney-Hyperion book listing](https://books.disney.com/book/the-lost-hero/) confirms the school trip and Camp Half-Blood destination. Neither publisher-owned page supplies the full opening dialogue.
- [Fresh Fiction's attributed opening excerpt](https://www.freshfiction.com/excerpt.php?id=41817) reproduces the opening text with author and publisher attribution. It is a secondary host, not an official publisher website. It identifies Butch, describes Hedge's rescue and abduction, and supplies the short quotations used in `src/story.ts`.

The game uses five brief verified quotations, 18 words total, from that excerpt. Other text is clearly presented as action captions, with no character name or speech attribution. The protest when Hedge is taken and Hedge's weather warning are the user's supplied reactions; neither is labeled a quotation from the novel. There is no invented farewell from Dylan. Existing intro and ending voice recordings are no longer triggered because they contain the superseded adaptation. Prophecy, music, ambience and sound effects remain active. This is not a full transcript or reproduction of the book's dialogue.

## Requested adaptation

The museum fight and chronology follow the user's latest instructions. In the novel, Leo falls first; Hedge's abduction precedes Jason's dive, and the trio return after the spirit has disappeared. The game deliberately places Piper's fall and Jason's dive first, then Leo's ledge and rescue, followed by the reunion, abduction and visible departure. This sequence must not be represented as the novel's precise order.

The game has one playable fight. Half health now escalates the storm without entering a rescue scene. Victory leads directly into the full staged sequence, rather than returning to another fight. Dylan is driven back and escapes; no permanent death is implied. Annabeth and Butch arrive in a chariot pulled by two winged horses, then leave with the trio for Camp Half-Blood.

## Assets and verification

New transparent pixel-art sheets and chariot were generated with the built-in image tool using Rodrigo's lineup as identity/style reference. Full prompts and file paths are recorded in `public/assets/art/story-v1-provenance.json`. The original combat sprites and reference are preserved. Alpha bounds were measured into `src/story-frames.ts`, with an isolated viewport for every character. Story sheets are preloaded before play. CSS stages the entrance, crossing, transformation, falls, ledge, ascent, cloud disappearance and chariot travel; reduced motion jumps to each stable end state.

Automated checks cover fight victory and defeat, no half-health story interruption, complete simulated wins for every fighter, all story shot rendering, asset/viewports, scene order, finite durations, quotation attribution, and exclusion of obsolete voice clips. Build and tests run locally. Live browser playback remains unverified under the existing permission block, including actual animation timing, composition, and mobile layout. Changes are local only: no GitHub push or Vercel deployment was performed for this revision.

## Ground contact and pacing follow-up

The 2D storyboard now fits a fixed 16:9 stage, so its ground line cannot drift relative to background art when the viewport changes. Character SVGs use bottom alignment; grounded actors share a floor baseline. Removed vertical breathing/walking offsets in the combat renderer so standing and walking sprites stay anchored to their physical ground position.

Added dedicated canyon shots for Leo gripping a ledge and Hedge making contact during the rescue, plus one joined Jason/Piper embrace sprite. The chariot has separate arrival, landed and fully boarded departure art: passengers are painted behind its walls, horses stand with folded wings while parked, and the same 62%-wide vehicle stage is retained during disembarkation. Transparent prop margins are removed with measured SVG viewports (the PNGs are preserved), so hooves and wheels align with the floor. Departure now shrinks and fades into the distance over 13.5 seconds. The new source files and built-in image-generation prompts are in `public/assets/art/story-v2-provenance.json`.

Combat uses 3,200 spirit health, with the HUD and halfway escalation derived from the maximum. A simulated player using movement, jump/guard defense, strong strikes and specials wins in approximately 102 seconds as Jason, 123 as Piper, and 177 as Leo, including hit pauses. The full-fight tests enforce a 75–120-second range for Jason and a 120–180-second range for Piper and Leo using that strategy. Actual player timing varies; there is no forced waiting period or invulnerability timer. Spot checks still exercise small remaining-health states for hit timing and victory logic.

Inspected offline native-canvas compositions made from the same art, crops, ground baseline and vehicle width to check grounded feet, wheel/hoof contact, passenger occlusion, and consistent vehicle scale. This does not validate browser CSS or animation playback. Full live browser testing remains pending; all changes remain local.

## Easier player health and bus conversation

Player maximum health is now 3,600 versus the wind spirit’s 3,200. Every restart restores the full player maximum; health-bar widths, accessibility values, and the low-health warning use that maximum. Incoming damage and the enemy’s health remain as previously tuned, making the long fight substantially more forgiving without extending the encounter. The bus no longer mentions a modified microphone or Leo’s special-boy remark. One action caption now conveys Leo asking whether Jason remembers him and their friendship, preserving the rule against inventing book quotations. Changes remain local.

## Stronger Jason, weather warning and book cover

Jason's quick, strong and special base damage is now 16, 33 and 52 respectively (before combo/counter bonuses). Piper and Leo are unchanged. The shorter Jason encounter follows the latest playtest request. Hedge says the user-supplied “I don't like this weather.” before the shelter caption; Dylan's crossing and transformation follow.

The book-selection tile uses a flat pixel-art adaptation of the original Festus cover, sourced from [Rick Riordan's official book page](https://rickriordan.com/book/the-lost-hero/). The original cover illustration is by John Rocco. The downloaded reference is preserved; the generated derivative, exact prompt and source are recorded in `public/assets/art/lost-hero-cover-v1-provenance.json`. The full cover fits without cropping on wide and narrow layouts. Live browser layout remains unverified under the existing permission block.
