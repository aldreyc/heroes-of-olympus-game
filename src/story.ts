export type Beat = {
  scene: string;
  chapter?: string;
  title: string;
  speaker: string;
  text: string;
  duration?: number;
  effect?: string;
  voice?: string;
  /** A brief verified quotation, user-supplied reaction, or action caption. */
  kind?: "quote" | "reaction" | "action" | "prophecy";
  shot?: string;
};
const action = (scene: string, title: string, text: string, shot?: string, duration = 5500): Beat =>
  ({ scene, title, speaker: "", text, kind: "action", shot, duration });
// Quoted dialogue: 18 words total from the attributed opening excerpt, not a reconstructed transcript.
// Source and the deliberate game chronology are documented in docs/story-revision.md.
export const opening: Beat[] = [
  action("bus", "The Wilderness School bus", "Jason wakes beside two people who know him. He cannot remember either of them—or his own past."),
  { scene: "bus", title: "A name without a past", speaker: "Piper", text: "Jason, you okay?", kind: "quote" },
  { scene: "bus", title: "A name without a past", speaker: "Jason", text: "I don't know you.", kind: "quote" },
  action("bus", "A friend he cannot remember", "Leo asks whether Jason remembers him and their friendship. Jason searches his memory, but nothing comes back."),
  { scene: "canyon", title: "The wind changes", speaker: "Coach Hedge", text: "I don't like this weather.", kind: "reaction", shot: "confront", duration: 3200 },
  action("museum", "Toward shelter", "The students head toward the museum for shelter from the wind.", "confront", 4500),
  action("museum", "The museum entrance", "Jason, Piper, and Leo enter with the school group, walking together.", "entrance", 6500),
  action("museum", "Dylan steps in", "Dylan pushes ahead of Leo and comes between Jason and Piper.", "passes", 5500),
  { scene: "museum", title: "The rising storm", speaker: "Coach Hedge", text: "Go, go, go!", kind: "quote", shot: "confront", duration: 2400 },
  action("museum", "The storm has a face", "Dylan’s human outline breaks apart into dark, swirling vapor.", "transform", 6500),
  action("reveal", "A choice before a memory", "Jason flips the coin. Instinct takes over.", undefined, 3800),
  { ...action("reveal", "A blade of gold", "The coin becomes one golden sword. The friends turn to face the wind spirit.", undefined, 3500), effect: "sword" },
];
opening[opening.length - 2].effect = "coin";

/** The playable encounter ends before the rescue: Dylan is driven back, not killed. */
export const ending: Beat[] = [
  action("rescue", "Over the edge", "A violent gust flings Piper over the railing.", "piper-fall", 4500),
  action("rescue", "Jason jumps", "Jason dives after her.", "jason-dive", 4200),
  action("rescue", "A handhold", "Dylan hurls Leo toward the canyon. Leo catches a narrow ledge and hangs on.", "leo-ledge", 5500),
  action("rescue", "The coach climbs", "Hedge reaches Leo and brings him back to safety.", "hedge-rescue", 5500),
  action("rescue", "The air catches them", "Jason catches Piper. The wind holds them above the river, then lifts them toward the rim.", "flight", 6500),
  action("museum", "Back at the rim", "Jason and Piper land beside Leo. Dylan has seized Coach Hedge.", "reunion", 4500),
  { scene: "museum", title: "The wind takes a hero", speaker: "The three friends", text: "Coach Hedge, no!", kind: "reaction", shot: "seized", duration: 2500 },
  { scene: "museum", title: "Into the clouds", speaker: "Dylan", text: "The mistress calls me back!", kind: "quote", shot: "seized", duration: 2700 },
  action("museum", "Beyond their reach", "The storm spirit spirals upward with Hedge. They gather speed and vanish into the cloud bank.", "departure", 8500),
  action("canyon", "A shape in the clearing sky", "Two winged horses draw a chariot down toward the damaged walkway.", "chariot-arrival", 6500),
  { scene: "canyon", title: "Annabeth and Butch", speaker: "Annabeth", text: "Where is he?", kind: "quote", shot: "annabeth", duration: 3800 },
  action("canyon", "Searching for Percy", "Annabeth is looking for Percy Jackson. Butch urges the group to leave before more storm spirits arrive.", "annabeth", 5500),
  action("canyon", "A way out", "Jason, Piper, and Leo board the chariot with Annabeth and Butch. They set off for Camp Half-Blood.", "chariot-leave", 14000),
];
