import { unlockAudio } from './sound';

let ctx: AudioContext | null = null;
let timer: number | null = null;
let stopAt = 0;
let hapticEl: HTMLLabelElement | null = null;

/** Hace que el sonido de la app ignore el interruptor de silencio del iPhone (Safari 16.4+). */
export function preferPlaybackAudio() {
  try {
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) nav.audioSession.type = 'playback';
  } catch {
    /* no disponible */
  }
}

/** Debe llamarse en un toque del usuario (p. ej. al marcar una serie) para que iOS permita sonar después. */
export function armAlarm() {
  preferPlaybackAudio();
  unlockAudio();
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    /* sin audio */
  }
  ensureHaptic();
}

/** iOS 18+: al pulsar un interruptor nativo (input switch) el iPhone da un toque háptico. Es lo único que permite Apple a las webs. */
function ensureHaptic() {
  if (hapticEl || typeof document === 'undefined') return;
  const label = document.createElement('label');
  label.setAttribute('aria-hidden', 'true');
  label.style.cssText = 'position:fixed;left:-100px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  label.appendChild(input);
  document.body.appendChild(label);
  hapticEl = label;
}

export function haptic() {
  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') navigator.vibrate([400, 150, 400]);
  } catch {
    /* nada */
  }
  try {
    ensureHaptic();
    hapticEl?.click();
  } catch {
    /* nada */
  }
}

/** Un «ring» de despertador: cuatro pitidos rápidos y agudos. */
function ring() {
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') void ctx.resume();
    const t0 = ctx.currentTime + 0.02;
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = i % 2 ? 1568 : 1319;
      const t = t0 + i * 0.13;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.35, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.11);
    }
  } catch {
    /* nada */
  }
}

/** Suena y vibra cada segundo hasta que se para (o como mucho `seconds`). */
export function startAlarm(seconds = 15) {
  stopAlarm();
  stopAt = Date.now() + seconds * 1000;
  const tick = () => {
    if (Date.now() > stopAt) return stopAlarm();
    ring();
    haptic();
  };
  tick();
  timer = window.setInterval(tick, 1100);
}

export function stopAlarm() {
  if (timer != null) window.clearInterval(timer);
  timer = null;
}

export const alarmActive = () => timer != null;
