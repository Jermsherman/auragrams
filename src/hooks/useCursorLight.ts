// Pointer-driven ambient light + optional 3D tilt for premium surfaces.
// Writes CSS custom properties (--mx/--my in %, --rx/--ry in deg) instead of
// re-rendering, and throttles updates to one write per animation frame.

import { useCallback, useEffect, useRef } from "react";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isCoarsePointer() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

export function useCursorLight<T extends HTMLElement = HTMLDivElement>(options?: {
  /** Max tilt in degrees. 0 disables tilt (light only). */
  tilt?: number;
}) {
  const tilt = options?.tilt ?? 0;
  const ref = useRef<T | null>(null);
  const frame = useRef<number | null>(null);
  const pending = useRef<{ x: number; y: number } | null>(null);
  const enabled = useRef(true);

  useEffect(() => {
    enabled.current = !prefersReducedMotion() && !isCoarsePointer();
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);

  const flush = useCallback(() => {
    frame.current = null;
    const el = ref.current;
    const p = pending.current;
    if (!el || !p) return;
    el.style.setProperty("--mx", `${p.x * 100}%`);
    el.style.setProperty("--my", `${p.y * 100}%`);
    if (tilt > 0) {
      el.style.setProperty("--ry", `${(p.x - 0.5) * 2 * tilt}deg`);
      el.style.setProperty("--rx", `${(0.5 - p.y) * 2 * tilt}deg`);
    }
  }, [tilt]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<T>) => {
      if (!enabled.current) return;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      pending.current = {
        x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
        y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
      };
      if (frame.current === null) frame.current = requestAnimationFrame(flush);
    },
    [flush],
  );

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--mx", "50%");
    el.style.setProperty("--my", "50%");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }, []);

  return { ref, onPointerMove, onPointerLeave } as const;
}
