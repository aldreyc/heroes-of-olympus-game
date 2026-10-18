type ProphecyActions = {
  show: (line: string) => void;
  hide: () => void;
  clear: () => void;
  speak: (key: string) => void;
  stopVoice: () => void;
  done: () => void;
  schedule: (callback: () => void, ms: number) => number;
  unschedule: (id: number) => void;
};

// Matched to the selected continuous recording using ElevenLabs word timings.
export const PROPHECY_TIMING = {
  leadMs: 250,
  fadeMs: 160,
  lineStartMs: [0, 3080, 6320, 8960],
  durationMs: 11800,
  tailMs: 220,
};

export function playProphecy(lines: string[], actions: ProphecyActions) {
  let active = true;
  const timers = new Set<number>();
  const after = (ms: number, callback: () => void) => {
    const id = actions.schedule(() => {
      timers.delete(id);
      if (active) callback();
    }, ms);
    timers.add(id);
  };
  const cancel = () => {
    if (!active) return false;
    active = false;
    timers.forEach(actions.unschedule);
    timers.clear();
    actions.stopVoice();
    return true;
  };
  const skip = () => {
    if (cancel()) actions.done();
  };
  const timing = PROPHECY_TIMING;
  after(timing.leadMs, () => {
    if (!lines.length) { skip(); return; }
    actions.show(lines[0]);
    actions.speak("prophecy-natural");
  });
  for (let index = 1; index < lines.length; index++) {
    const cue = timing.leadMs + timing.lineStartMs[index];
    after(cue - timing.fadeMs, actions.hide);
    after(cue, () => {
      actions.clear();
      actions.show(lines[index]);
    });
  }
  after(timing.leadMs + timing.durationMs, () => {
    actions.hide();
    after(timing.fadeMs, () => {
      actions.clear();
      after(timing.tailMs, skip);
    });
  });
  return { skip, cancel };
}
