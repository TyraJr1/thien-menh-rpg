type Sound = 'bell' | 'strike' | 'guard' | 'skill' | 'reward';
let context: AudioContext | undefined;
let enabled = false;
try {
  enabled = localStorage.getItem('thien-menh.audio') === 'on';
} catch { /* Silent by default. */ }

export function soundOn() {
  return enabled;
}

export function toggleAudio() {
  enabled = !enabled;
  try {
    localStorage.setItem('thien-menh.audio', enabled ? 'on' : 'off');
  } catch { /* Session preference still applies. */ }
  if (enabled) playSound('bell');
}

const notes: Record<Sound, [number, number, number, OscillatorType][]> = {
  bell: [[523, 503, 0.55, 'sine'], [784, 770, 0.38, 'sine']],
  strike: [[220, 70, 0.13, 'triangle']],
  guard: [[165, 113, 0.22, 'sine']],
  skill: [[320, 680, 0.27, 'triangle'], [480, 930, 0.34, 'sine']],
  reward: [[392, 392, 0.32, 'sine'], [587, 587, 0.47, 'sine']],
};

export function playSound(sound: Sound) {
  if (!enabled || !window.AudioContext || document.hidden) return;
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume().catch(() => {});
    const start = context.currentTime;
    notes[sound].forEach(([from, to, duration, type], index) => {
      const oscillator = context!.createOscillator();
      const envelope = context!.createGain();
      const onset = start + index * 0.055;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(from, onset);
      oscillator.frequency.exponentialRampToValueAtTime(to, onset + duration);
      envelope.gain.setValueAtTime(0.0001, onset);
      envelope.gain.exponentialRampToValueAtTime(0.06, onset + 0.025);
      envelope.gain.exponentialRampToValueAtTime(0.0001, onset + duration);
      oscillator.connect(envelope).connect(context!.destination);
      oscillator.start(onset);
      oscillator.stop(onset + duration);
      oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
    });
  } catch { /* Play remains available without Web Audio. */ }
}
