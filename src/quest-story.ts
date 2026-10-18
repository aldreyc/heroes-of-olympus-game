import type { Beat } from "./story";

const quest = (title: string, text: string, shot: string, duration = 7500): Beat =>
  ({ scene: "quest", chapter: "THE QUEST", kind: "action", speaker: "", title, text, shot, duration });

// Condensed scenes requested by Rodrigo. Captions describe action, not invented book quotations.
export const questBriefing: Beat[] = [
  quest("Three heroes. One quest.", "Chiron gathers Jason, Piper, and Leo. The centaur explains that Hera is a prisoner. The three must leave camp to free her—and find Coach Hedge.", "quest-chiron", 10000),
  quest("The Oracle of Delphi", "Rachel Elizabeth Dare joins them. The red-haired artist is a mortal, but the spirit of the Oracle speaks through her. Emerald mist rises as the camp falls silent.", "quest-rachel", 8500),
  { ...quest("The prophecy", "Child of Lightning, beware the earth,\nThe giants’ revenge, the seven shall birth.\nThe forge and dove shall break the cage,\nAnd death unleash through Hera’s rage.", "quest-oracle", 15000), kind: "prophecy", speaker: "RACHEL · ORACLE OF DELPHI", voice: "rachel-prophecy" },
  quest("The road ahead", "Chiron names Jason to lead the quest. Leo brings Festus, and Piper completes the trio. Lightning, forge, and dove must work together: free Hera, rescue Hedge, and face the danger foretold by the Oracle.", "quest-revealed", 11000),
];

export const questJourney: Beat[] = [
  quest("Beyond Half-Blood Hill", "At first light, Leo takes the front seat on Festus. Piper and Jason settle behind him. Together, they leave the safety of camp.", "quest-takeoff", 8500),
  quest("Into the horizon", "Bronze wings carry the three friends over the trees. Camp grows smaller below them, until Festus is only a glimmer against the distant sky.", "quest-horizon", 13000),
  quest("A strange welcome", "Their journey brings them to a glittering shopping mall. Festus circles down toward the plaza outside.", "mall-landing", 8500),
  quest("Wait here, Festus", "Festus stays outside. Jason, Piper, and Leo walk through the inviting entrance together.", "mall-enter", 9500),
  quest("Medea’s department store", "Inside, shelves sparkle with enchanted treasures and colored potions. A sorceress waits among the displays: Medea.", "mall-meet", 8500),
  quest("A voice that twists the truth", "Medea’s enchantment reaches for Jason and Leo. Piper recognizes the danger. They must resist the spell and stand together.", "mall-spell", 8500),
];

export const medeaEnding: Beat[] = [
  quest("The spell breaks", "Medea’s magic falters. The friends shake off her influence—but a metallic scrape rises behind the displays.", "mall-victory", 5500),
  quest("A guardian of gold", "One mechanical dragon steps into their path. Smaller than Festus, it gleams with pure golden armor. Red eyes lock onto the three friends. They must fight their way past it.", "mall-golden-dragon", 7500),
];

export const goldenDragonEnding: Beat[] = [
  quest("Through the window", "The golden dragon is badly weakened, with only a third of its strength remaining. Glass shatters overhead—Festus bursts through the window!", "mall-festus-window", 5000),
  quest("Bronze fire", "Festus opens his jaws. A roaring blast of fire strikes the smaller golden machine, overwhelming its battered armor.", "mall-festus-fire", 6500),
  quest("The guardian falls", "The golden dragon’s red eyes go dark. Its gears grind to a halt, leaving the way clear.", "mall-dragon-fallen", 4500),
  quest("Coach Hedge!", "Beyond the shattered enchantment, they find Coach Hedge and free him. The rescue brings one friend back—but Hera is still waiting.", "mall-hedge", 8500),
  quest("The quest continues", "Outside, Festus waits for them. Jason, Piper, Leo, and Coach Hedge regroup. Their next task remains: find Hera and break her cage.", "mall-regroup", 9000),
];

export const mansionJourney: Beat[] = [
  quest("A moment to breathe", "Outside the mall, Jason, Piper, and Coach Hedge settle onto Festus’s back. Leo checks their grip on the bronze ridges. For a moment, everyone is safe together.", "mansion-departure", 9000),
  quest("Above the winter hills", "Festus carries the four travelers away from the city. The danger of Medea’s store falls behind them. Cool air rushes past, and the friends finally have a little room to breathe.", "mansion-relief", 10000),
  quest("Out of the blue", "A huge blue beam tears up through the sky and strikes Festus’s wing. Sparks burst from the metal joint. The steady beat of his wings breaks.", "mansion-blue-strike", 7500),
  quest("Hold on", "Festus pitches downward. All four riders cling to his back as smoke streams from the damaged wing and the clouds rush past.", "mansion-descent", 8500),
  quest("The mansion below", "Through the thinning clouds, a mansion appears among the snowy trees. Festus is dropping toward its grounds, carrying his passengers with him.", "mansion-reveal", 8500),
];

export const QUEST_ART = ["quest-cast-v1", "medea-combat-v1", "festus-trio-flight-v1", "medea-mall-exterior-v1", "medea-mall-arena-v1", "golden-dragon-v2", "festus-window-v1"];
