export type Beat = {
  scene: string;
  title: string;
  speaker: string;
  text: string;
  duration?: number;
  effect?: string;
  voice?: string;
};
export const opening: Beat[] = [
  {
    scene: "bus",
    title: "Somewhere in Arizona",
    speaker: "The story begins",
    text: "Before the storm, there was only a name. Jason. He wakes on a school bus with no memory of his past. Beside him, Piper and Leo insist they are his friends. Ahead lies the Grand Canyon, and a danger older than the world they know. Somewhere in the wind, something is waiting. Every legend begins with a choice. Today, Rodrigo, the next move is yours.",
    duration: 26500,
    voice: "intro",
  },
  {
    scene: "bus",
    title: "A name without a past",
    speaker: "Jason",
    text: "Jason. That’s my name. But this bus… these people… why can’t I remember anything?",
  },
  {
    scene: "bus",
    title: "A name without a past",
    speaker: "Piper",
    text: "Hey. Look at me. You’re safe. It’s Piper. You really don’t remember us?",
  },
  {
    scene: "bus",
    title: "A name without a past",
    speaker: "Leo",
    text: "Not even your best friend? Wow. I knew my jokes were bad, but that hurts.",
  },
  {
    scene: "bus",
    title: "A name without a past",
    speaker: "Coach Hedge",
    text: "Keep it down back there. And when we get off this bus, nobody wanders away. Got it?",
  },
  {
    scene: "canyon",
    title: "The Grand Canyon",
    speaker: "Jason",
    text: "A whole world opens beneath the sky. I should remember seeing something like this. I should remember something.",
  },
  {
    scene: "museum",
    title: "The museum · Skywalk entrance",
    speaker: "Coach Hedge",
    text: "I was watching those two. Then you showed up. Whatever you are, kid, stay close. There’s something wrong with this wind.",
  },
  {
    scene: "museum",
    title: "Something in the wind",
    speaker: "Piper",
    text: "The doors are closed. So why are all the papers moving?",
    effect: "wind",
  },
  {
    scene: "reveal",
    title: "The storm has a face",
    speaker: "Dylan",
    text: "You finally noticed. Let’s see how long your little group can stay together.",
    effect: "spirit",
  },
  {
    scene: "reveal",
    title: "The storm has a face",
    speaker: "Coach Hedge",
    text: "Behind me! All of you! Nobody takes my students.",
    effect: "spirit",
  },
  {
    scene: "reveal",
    title: "A choice before a memory",
    speaker: "Jason",
    text: "There’s a coin in my pocket. My hand knows what to do… even if I don’t.",
    effect: "coin",
    duration: 6500,
  },
  {
    scene: "reveal",
    title: "A blade of gold",
    speaker: "Jason",
    text: "Piper. Leo. Stay together. We get through this together.",
    effect: "sword",
    duration: 3800,
  },
];
export const interruption: Beat[] = [
  {
    scene: "rescue",
    title: "The edge of the world",
    speaker: "Piper",
    text: "Jason!",
    duration: 2200,
  },
  {
    scene: "rescue",
    title: "A power without a memory",
    speaker: "Jason",
    text: "I’ve got you. I don’t know how—but I’ve got you.",
    duration: 4200,
  },
  {
    scene: "rescue",
    title: "Nobody left behind",
    speaker: "Coach Hedge",
    text: "Let the kid go! Leo, get back to the others!",
    duration: 4200,
  },
];
export const ending: Beat[] = [
  {
    scene: "rescue",
    title: "The wind takes a hero",
    speaker: "Leo",
    text: "Coach! He pushed me clear… and that thing took him instead.",
  },
  {
    scene: "canyon",
    title: "Three friends. One mystery.",
    speaker: "Piper",
    text: "You flew, Jason. You caught me. Who are you? How could you do that?",
  },
  {
    scene: "canyon",
    title: "Three friends. One mystery.",
    speaker: "Leo",
    text: "And do you remember us now? Anything at all?",
  },
  {
    scene: "canyon",
    title: "Three friends. One mystery.",
    speaker: "Jason",
    text: "I wish I did. I don’t know who I am. But we’re going to find Coach Hedge.",
  },
  {
    scene: "canyon",
    title: "This is only the beginning",
    speaker: "The story continues",
    text: "The wind has fallen silent. But Coach Hedge is gone, carried away into the storm. Jason has saved his friends, yet his own past remains beyond his reach. Three heroes. One mystery. And a journey that has only just begun.",
    duration: 16300,
    voice: "ending",
  },
];
