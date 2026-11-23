let sentinel: WakeLockSentinel | null = null;
let wanted = false;

async function acquire() {
  try {
    if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
    sentinel = await navigator.wakeLock.request('screen');
    sentinel.addEventListener('release', () => {
      sentinel = null;
    });
  } catch {
    sentinel = null;
  }
}

document.addEventListener('visibilitychange', () => {
  if (wanted && document.visibilityState === 'visible' && !sentinel) void acquire();
});

export function setKeepAwake(on: boolean) {
  wanted = on;
  if (on && !sentinel) void acquire();
  if (!on && sentinel) {
    void sentinel.release().catch(() => {});
    sentinel = null;
  }
}
