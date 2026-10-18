import type { Beat } from "./story";

// The simultaneous claiming and Drew's tour are Rodrigo's condensed adaptation.
// These are action captions, not quotations from The Lost Hero.
const camp = (title: string, text: string, shot: string, duration: number): Beat =>
  ({ scene: shot.startsWith("forest") || shot.startsWith("dragon") ? "woods" : "camp", chapter: "CAMP HALF-BLOOD", title, text, speaker: "", kind: "action", shot, duration });

export const campArrival: Beat[] = [
  camp("A place for demigods", "The chariot touches down at Camp Half-Blood. Beyond the lawn, the cabins glow in the evening light.", "camp-touchdown", 7000),
  camp("Children of Olympus", "Signs of their divine parents shimmer above them: Jupiter’s lightning over Jason, Aphrodite’s dove over Piper, and Hephaestus’s fiery hammer over Leo.", "camp-claiming", 11000),
  camp("A new home", "Drew meets the three newcomers and leads them toward their cabins.", "camp-tour", 7500),
  camp("The sky god’s cabin", "Drew brings Jason to Cabin One, the temple-like cabin of Zeus. Jason knows his father by the Roman name Jupiter.", "camp-jason-cabin", 7500),
  camp("The house of Aphrodite", "Next, Drew shows Piper the Aphrodite cabin, its porch bright with roses.", "camp-piper-cabin", 7500),
  camp("A child of the forge", "At the Hephaestus cabin, warm light spills from the workshop. Drew leaves Leo with the sounds of hammers and turning gears.", "camp-leo-cabin", 7500),
  camp("Beyond the cabins", "Later, Leo slips into the woods. He follows the trail between the trees, curious about the bronze scraps scattered beside it.", "forest-walk", 12000),
  camp("Something in the trees", "A metallic creak breaks the quiet. Leo stops and looks toward a clearing.", "forest-listen", 5500),
  camp("Bronze beneath the branches", "Between the trunks, Leo finds an enormous mechanical dragon. Bronze plates catch the moonlight. Amber eyes watch him approach.", "dragon-approach", 10000),
  camp("The bronze dragon", "Leo stands before Festus, the lost bronze dragon of Camp Half-Blood. A mystery of gears, metal, and fire waits in the clearing.", "dragon-discovery", 8500),
];

export const CAMP_ART = ["camp-half-blood-v1", "camp-woods-v2", "camp-walk-v1", "festus-discovery-v1"];

export const dragonReturn: Beat[] = [
  camp("A dragon's favorite drink", "Leo reaches the vat of Tabasco and motor oil. Festus lowers his head to drink. The flames fade, and the bronze dragon settles beside him.", "dragon-calm", 8500),
  camp("A way onto his back", "Leo grips a ridge of bronze, steps onto the foreleg, and climbs carefully onto Festus’s shoulders.", "dragon-mount", 7500),
  camp("Bronze wings", "Leo holds tight as the mechanical wings unfold. Festus rises above the trees.", "dragon-takeoff", 8500),
  camp("Back to Camp Half-Blood", "Festus carries Leo back over the cabins and glides down toward camp. This time, the bronze dragon has a rider.", "camp-dragon-return", 11000),
];
