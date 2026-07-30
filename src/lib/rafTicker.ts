// Single shared requestAnimationFrame clock.
//
// Every orb (and any other animated surface) subscribes here instead of
// starting its own rAF loop, so the browser schedules one frame of work per
// page rather than one per component. Subscribers can request a reduced fps
// budget, and the whole loop parks itself while the tab is hidden.

type Sub = {
  cb: (now: number) => void;
  interval: number;
  last: number;
};

const subs = new Set<Sub>();
let rafId = 0;
let listening = false;

function hidden() {
  return typeof document !== "undefined" && document.hidden;
}

function loop(now: number) {
  rafId = requestAnimationFrame(loop);
  for (const s of subs) {
    if (s.interval === 0 || now - s.last >= s.interval) {
      s.last = now;
      try {
        s.cb(now);
      } catch (e) {
        console.warn("[rafTicker] subscriber threw", e);
      }
    }
  }
}

function start() {
  if (rafId || subs.size === 0 || hidden()) return;
  if (typeof requestAnimationFrame === "undefined") return;
  rafId = requestAnimationFrame(loop);
}

function stop() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
}

function ensureVisibilityListener() {
  if (listening || typeof document === "undefined") return;
  listening = true;
  document.addEventListener("visibilitychange", () => {
    if (hidden()) stop();
    else start();
  });
}

/**
 * Subscribe to the shared frame loop.
 * @param fps target frames per second (60 = every frame).
 * @returns unsubscribe
 */
export function subscribeFrame(cb: (now: number) => void, fps = 60): () => void {
  if (typeof window === "undefined") return () => {};
  ensureVisibilityListener();
  const sub: Sub = { cb, interval: fps >= 60 ? 0 : 1000 / fps, last: 0 };
  subs.add(sub);
  start();
  return () => {
    subs.delete(sub);
    if (subs.size === 0) stop();
  };
}
