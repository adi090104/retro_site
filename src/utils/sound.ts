let ctx: AudioContext | null = null;

/** A short chiptune-style blip. Notes are [frequency Hz, start offset s]. */
export function playBlip(notes: [number, number][], duration = 0.06, type: OscillatorType = 'square') {
  try {
    ctx ??= new AudioContext();
    const audio = ctx;
    const now = audio.currentTime;
    for (const [freq, offset] of notes) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.035, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + duration);
      osc.connect(gain).connect(audio.destination);
      osc.start(now + offset);
      osc.stop(now + offset + duration + 0.02);
    }
  } catch {
    // Audio is a nicety; ignore browsers that refuse it.
  }
}

/** A tiny synthesized stand-in for the classic error "chord". */
export function playChord() {
  try {
    ctx ??= new AudioContext();
    const audio = ctx;
    const now = audio.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.07, now + 0.015 + i * 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
      osc.connect(gain).connect(audio.destination);
      osc.start(now);
      osc.stop(now + 0.75);
    });
  } catch {
    // Audio is a nicety; ignore browsers that refuse it.
  }
}
