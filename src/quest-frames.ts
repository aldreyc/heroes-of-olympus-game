// Explicit source bounds keep neighboring sprites out of every viewport.
export const questFrames = {
  golden: { file: "golden-dragon-v2.png", size: [1536, 1024], frames: [[24, 22, 762, 488], [789, 37, 746, 473], [27, 538, 756, 456], [792, 612, 736, 382]] },
  festusWindow: { file: "festus-window-v1.png", size: [1536, 1024], rect: [5, 4, 1525, 958] },
  chiron: { file: "quest-cast-v1.png", size: [1536, 1024], rect: [96, 3, 633, 987] },
  rachel: { file: "quest-cast-v1.png", size: [1536, 1024], rect: [912, 84, 577, 909] },
  medea: { file: "medea-combat-v1.png", size: [1024, 1536], frames: [[116, 38, 324, 694], [526, 59, 480, 677], [25, 769, 471, 703], [604, 846, 381, 626]] },
  // Two clean wing phases; the lower two generated cells touch and are deliberately unused.
  flight: { file: "festus-trio-flight-v1.png", size: [1536, 1024], logical: [780, 510], frames: [[28, 28, 750, 468], [785, 126, 745, 370]], offsets: [[15, 30], [15, 128]] },
};
