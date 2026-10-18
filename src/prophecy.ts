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
  const show = (index: number) => {
    if (index >= lines.length) { skip(); return; }
    actions.show(lines[index]);
    // Read during the four-second fully-visible hold, after the 800ms fade.
    after(800, () => actions.speak(`prophecy-${index + 1}`));
    after(4800, () => {
      actions.stopVoice();
      actions.hide();
      after(800, () => {
        actions.clear();
        if (index + 1 < lines.length) after(300, () => show(index + 1));
        else after(700, skip);
      });
    });
  };
  after(650, () => show(0));
  return { skip, cancel };
}
