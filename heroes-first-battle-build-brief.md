# Production Game Brief: Heroes of Olympus — Opening Chapter

## Paste-ready instructions for Codex

Build the polished opening chapter of a real *Heroes of Olympus* game. This is not a disposable prototype or a mockup. Treat the bus scene, Grand Canyon arrival, museum sequence, and first wind-spirit battle as finished game content, with intentional art direction, reliable controls, expressive animation, and complete scene transitions. Do not inspect, open, reuse, or modify the old prototype; start fresh from this brief and the supplied character-art references.

The larger game vision is a full-series adventure: players can choose a book, select a character, experience the battles from that book, and eventually explore freely between story events. This brief covers the finished opening chapter and its first battle only. Keep free-roam systems and later-book content out of this chapter, while making design decisions that will not prevent the larger game from growing later.

The game should feel like a lively **2D side-view fighting game**: two characters face each other across an arena, the player can move, jump, block, and attack, and each hit has readable pixel-art animation and impact feedback. Take inspiration from the clarity, pace, responsiveness, and excitement of *Mortal Kombat*, while creating an original interface and presentation. Do not copy its logos, layouts, fonts, character poses, or finishing moves.

## The fan and the player

Take the role of a fan-first creative director and lead game developer. Make every design choice for a player who is a **huge, deeply devoted *Heroes of Olympus* fan**. They know the characters, books, relationships, locations, personalities, and important story beats extremely well. They notice when a character acts out of character, a scene happens in the wrong order, a costume or power is wrong, or a location feels generic. They want the world to feel lovingly understood, not vaguely inspired.

This player also loves watching TV and wants the story scenes to feel like a great fantasy series: expressive performances, cinematic framing, purposeful pauses, strong atmosphere, and emotional continuity. They also love *Mortal Kombat* and want the combat to feel immediate, stylish, satisfying, and easy to read. Balance those tastes: make the cutscenes rich and character-focused, then hand over control cleanly so the player can fight.

Before settling any disputed canon detail, research it carefully using the books or reliable author/publisher material when available. Keep a small internal canon checklist for names, sequence of events, character traits, weapons, powers, and setting. Never invent a supposedly canonical quote or detail to fill a gap. If a requested game feature intentionally changes canon, preserve it as the user's deliberate adaptation and keep the rest of the scene consistent. Write fresh dialogue that captures the scene's purpose and character dynamics; do not reproduce book passages. If an essential detail cannot be verified, flag the uncertainty instead of presenting a guess as fact.

## Player experience

The player should be able to start the game, choose Jason, Piper, or Leo, watch the cinematic opening, and then immediately take control in a one-on-one fight against the wind spirit. The controls should be easy to discover, the first attack should feel satisfying, and the battle should be winnable without a long tutorial. Make the chapter feel complete, not like a temporary test screen.

## Visual direction

- Use crisp pixel art with clearly visible pixels, strong silhouettes, and expressive poses. Keep the characters consistent with the supplied character reference image in the project assets: youthful, modern-day demigods, recognizable hair and clothing, and a warm illustrated palette.
- Render pixel art without smoothing so it stays sharp when scaled. Make the combatants large enough to read at a glance.
- The arena is a museum space at the Grand Canyon: exhibit displays and stone walls in the background, a wide clear fighting lane in the foreground, scattered papers and dust, and a hint of the canyon or skywalk through windows or an opening. Keep background detail subdued so it does not obscure the fighters.
- The wind spirit has a creepy visible face held inside a dark, smoky tornado-shaped body. It should feel eerie and powerful, with curling wisps and a shifting silhouette. **Do not give it lightning or electrical effects.** Wind gusts can move dust, papers, hair, and clothing instead.
- Give each scene a distinct camera composition. The bus scene looks down the aisle toward the back seats. The museum scene uses a wider establishing view. The fight uses a stable side-on camera.

## Character selection

Create a title screen and character-select screen for Jason, Piper, and Leo. Show each as a large pixel-art portrait or idle sprite, with a short original description and a clear selected-state outline. Include keyboard and mouse selection, a start/confirm action, and a visible control hint. Remember the selected character when the scene transitions into the fight.

Give each fighter a small, understandable moveset that fits their character. Jason is the recommended default for the first playthrough. Piper and Leo must still be selectable and controllable; give them distinct attacks and animations rather than merely changing the name on Jason’s sprite. The core story cutscenes can keep the same events for every selection. Jason’s weapon transformation remains visible in the story even if another character is selected; when Piper or Leo is selected, they fight as the player while Jason appears as a story character or brief assist.

### Jason’s transforming weapon

Jason carries a **coin that transforms into a golden sword**. Show the transformation clearly: Jason flips the coin into the air; it glints, expands, and becomes a gleaming gold sword in his hand, with a short visual pulse and sound cue. For this first-battle sequence, the coin becomes the **golden sword**, and Jason enters the encounter holding it.

## Scene sequence and direction

### Scene 1 — School bus, before the fight

Open on a moving school bus interior. Use a camera looking from the middle of the aisle toward the back, with Jason, Piper, and Leo seated together in the final rows. Show enough seats, windows, and aisle to make it unmistakably the inside of a full-size bus, not a tiny bus icon or exterior establishing shot. Let the bus sway gently; sunlight and passing scenery move across the windows.

Jason comes to, looks around, and realizes he cannot remember who he is. Piper leans toward him with concern and speaks as if they already know each other well. Leo tries to explain that he is Jason’s friend and that they are on a school trip. Jason’s confusion should be visible in his expressions and pauses. Coach Hedge is nearby as a gruff chaperone and should get a distinct bus-scene line or reaction. Verify the placement and meaning of the Coach Hedge remark the user has in mind against a legitimate copy of the book or a user-provided excerpt; do not invent a line and present it as canonical. Use **new, original dialogue** or a concise paraphrase for the game; do not copy passages from the novel.

Keep this scene short and readable. Use character name labels, a dialogue box, and a small portrait or speaking animation for whoever has the line. Let the scene finish with the bus arriving at the Grand Canyon.

### Scene 2 — Grand Canyon arrival and museum approach

Show a quick exterior view that establishes the scale of the Grand Canyon, then transition to the museum entrance. Use a short guided transition or a few steps of movement if needed, but do not turn this into free roam. Coach Hedge draws Jason aside and gives a wary warning: in paraphrase, he has been sent to retrieve Jason and two other demigods, and he senses danger nearby. Keep Hedge’s meaning clear while making the dialogue original.

The students enter the museum. Build a brief moment of calm: quiet exhibits, distant classmates, a gust under the door, a loose map or brochure sliding across the floor. Gradually increase the wind. The room darkens slightly as dust and papers spiral toward the center.

### Scene 3 — Wind spirit reveal and Jason’s sword moment

The wind gathers into a dark tornado-shaped body. A creepy face forms in the smoke and turns toward the group. Make the reveal unsettling through the spirit’s movement, sound, and the room’s reaction—not lightning. Coach Hedge steps between it and the students. The spirit lunges; Hedge reveals that he is more than an ordinary coach and tries to protect Leo and Piper.

Before player control begins, give Jason a clear weapon beat. He flips the coin into the air, and it transforms into a **golden sword**. Hold on the sword for a moment so the player can see the gold and understand that the coin changed form. End the cutscene on the fighters facing each other. **Hand control to the player immediately after this cutscene; the fight starts at once.** Do not insert another menu or long explanation between the reveal and combat.

### Scene 4 — One-on-one side-view battle

Use a side-on arena layout with the selected hero on the left and the wind spirit on the right. Display readable health bars, fighter names, a small special-move meter, and a brief round-start title. Keep the interface original and uncluttered. The spirit should hover, coil, and slide with gusts rather than stand like a human opponent.

Provide keyboard controls and on-screen buttons for touch or mouse users:

- Move left/right
- Jump
- Block
- Quick attack
- Strong attack
- Special move

Show the controls on screen until the player makes their first move, then reduce them to a small hint. Add satisfying but brief hit reactions, wind-push effects, dust, and screen shake on heavier attacks. Make sure the player can tell when an attack lands, when the spirit is attacking, and when blocking works. Avoid gore and graphic finishing moves.

Give the wind spirit a few readable attack patterns: a low gust that can be jumped over, a sweeping gust that can be blocked, and a short charge that leaves it open to a counterattack. Keep the fight short and forgiving. If Jason is selected, his sword attacks should be the main moveset and the sword should remain visible. Piper and Leo should have their own distinct visual attacks. Preserve the dramatic story stakes without requiring complicated combos.

### Scene 5 — Story beat and ending

During the battle, include one brief interruption or staged story beat: a gust throws Piper toward danger, Jason rushes to save her, and Coach Hedge gets separated from the group. Keep this moment visually clear and short, then resume the fight or finish the encounter. The wind spirit ultimately carries Hedge away and vanishes into the storm. The game’s version can adapt who performs the rescue based on the selected fighter, but keep Jason’s coin transforming into a golden sword and Hedge’s disappearance as important story moments.

After victory, show Piper and Leo reacting with alarm and asking Jason who he is, how he could do what he just did, and whether he remembers them. Jason admits that he has no memory or explanation. Use original, concise dialogue that captures those ideas without copying the book. End the chapter on a cinematic story beat and a polished chapter-complete screen with options to replay the encounter or continue the story.

## Audio and feedback

Use light bus ambience in the opening, quiet museum room tone before the reveal, then rising wind and a distinct transition into combat music. Keep sound optional and provide a mute control. Use short UI sounds for selection, hits, blocking, and the weapon transformation. If there are no audio assets, use simple generated tones or omit sound cleanly; do not let missing audio prevent play.

## Implementation expectations

- Start a clean game project from this brief; do not inspect or build on the old prototype. Use the supplied character reference as visual guidance where available.
- Build this as a production-quality opening chapter, not a proof-of-concept with placeholder screens, fake buttons, or unfinished transitions. Choose a suitable game framework and structure the project cleanly for future chapters and battles. Explain the setup and how to run the game.
- Make the game responsive so the arena and controls remain usable on a typical laptop screen and a narrow screen.
- Use accessible text contrast, visible focus states, and buttons that can be operated with keyboard or pointer.
- Include a restart path and handle win/loss states without getting stuck.
- Keep this chapter focused: do not add free roam, extra battles, online features, accounts, or unrelated systems yet.
- Do not reproduce book dialogue verbatim. Write original dialogue that conveys the scene beats above.

## Completion checklist

1. The player can start the game and select Jason, Piper, or Leo.
2. The bus scene clearly shows Jason, Piper, and Leo at the back of an actual bus, with original dialogue about Jason’s confusion and their apparent friendship.
3. The story transitions to the Grand Canyon museum with Coach Hedge’s warning represented in paraphrase.
4. The storm spirit is a creepy face in a dark smoky tornado body, with no lightning.
5. Jason’s coin transforms into a golden sword before the first battle.
6. Player control begins immediately after the reveal cutscene, in a functional side-view fight with clear controls and feedback.
7. Piper’s danger moment and Coach Hedge being carried away are shown as short story beats.
8. The post-battle scene includes Piper and Leo asking about Jason’s identity, actions, and memory, followed by a replay or character-select option.
9. The opening chapter runs reliably and can be played from beginning to end, with polished transitions and no placeholder interactions.

## Movement and animation quality

Make every character movement feel smooth, natural, and intentional. Walking should have a convincing rhythm and weight; hands and arms should move naturally during dialogue, idle poses, and actions. A sword slash must read as a real, committed slash, with a clear wind-up, swing, and recovery. Jumps should have appealing anticipation, a readable arc, and a believable landing. Give each movement enough frames and follow-through to feel polished rather than stiff or abrupt. Apply the same care to every action so the characters feel alive in cutscenes and responsive during combat.

## Main menu and story entry

Make the menus clean, polished, and easy to understand, with an ancient Greek visual style. Use a restrained palette, elegant Greek-inspired borders or patterns, and subtle imagery such as stone, laurel, or parchment. Keep the text and choices highly readable; decoration should never crowd the controls.

The first screen has one prominent **Play** button centered on the screen. Selecting it opens book selection. For this opening chapter, **The Lost Hero** is the only available book choice. Selecting its clear, attractive book tile opens character selection for Jason, Piper, and Leo. After the player confirms a character, begin the story with the book’s prophecy before the school-bus scene.

### Prophecy reveal — precise timing and presentation

After character selection, transition to a **completely black screen**. Hide all menus, borders, icons, labels, and other decorations. Show only one centered prophecy line at a time, in clear white lettering with a very soft white aura around the letters. Do not display multiple lines together.

Use the four lines below in this exact order and wording:

1. “Child of Lightning, beware the earth,”
2. “The giants' revenge, the seven shall birth.”
3. “The forge and dove shall break the cage,”
4. “And death unleash through Hera's rage.”

For each line, fade it in from black, hold it fully visible for **four seconds**, then fade to complete black before revealing the next line. Keep the black interval between lines brief and consistent. Use the same white glow and centered placement for every line. After the fourth line has been visible for four seconds, fade it out to black; in the full game, briefly hold on black and then transition into the school-bus cutscene. In a menu-to-prophecy-only preview, stop on black after the fourth line. Do not add a “continue” prompt or other menu on the prophecy screen.
