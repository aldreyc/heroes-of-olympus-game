import type { Beat } from "./story";
const beat = (title: string, text: string, shot: string, duration = 8000): Beat =>
  ({scene:"midas-story",chapter:"THE GOLDEN KING",kind:"action",speaker:"",title,text,shot,duration});

export const midasArrival: Beat[] = [
  beat("Impact", "Festus strikes the mansion grounds. A great burst of fire, snow, and smoke erupts around the landing site. The riders scramble clear of the blast.", "midas-crash", 7500),
  beat("One more repair", "Festus lies still, badly damaged but whole. Leo drops to his knees and works desperately at the bent bronze plates. Jason, Piper, and Coach Hedge watch him try.", "midas-repair", 11000),
  beat("A visitor from the forge", "Warm light gathers beside the wreck. Hephaestus appears, looking from his son to the wounded machine.", "midas-hephaestus", 7000),
  { ...beat("Nothing is wasted", "No machine lasts forever. Not even the best ones. But everything can be reused.", "midas-forge-words", 8500), kind:"reaction", speaker:"Hephaestus", voice:"hephaestus-reuse" },
  beat("Back to the forge", "Hephaestus lifts Festus’s intact body into the air. God and machine rise together, growing smaller until their glow disappears into the sky.", "midas-ascension", 12000),
  beat("Guard the entrance", "Jason, Piper, and Leo head into the mansion. They ask Coach Hedge to keep watch outside. He stays beside the door as the three enter.", "midas-enter", 9500),
  beat("Two flashes of gold", "Inside, two small blasts of golden light strike Piper and Leo. Both freeze into gold statues. Jason spins toward the light.", "midas-friends-gold", 8500),
  beat("King Midas", "King Midas steps from the room beyond, his golden hand raised. Jason faces him alone. Ten unblocked golden hits will turn Jason completely to gold.", "midas-reveal", 8500),
];

export const midasEnding: Beat[] = [
  beat("The golden king falters", "Jason drives Midas back. The king lowers his hand, and the flying gold falls still.", "midas-victory", 6500),
  beat("His friends are waiting", "Jason reaches Piper and Leo. Midas has been defeated, but his friends still stand covered in gold. He must find a way to free them.", "midas-aftermath", 8500),
];
