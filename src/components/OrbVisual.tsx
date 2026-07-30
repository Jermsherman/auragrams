import { useEffect, useRef, useId, useMemo } from "react";
import { cn } from "@/lib/utils";
import { getPersonality, type AuraPersonality, type MoodKey, type AuraProfile } from "@/lib/aura";
import { bandGain, resolveBands, type BandKey, type BandsConfig } from "@/lib/auraBands";
import type { AuraEffect } from "@/lib/auraEffects";
import type { AudioMetrics } from "@/hooks/useAudioAnalyser";


type Props = {
  size?: number | string;
  hueShift?: number;
  intensity?: number;
  className?: string;
  analyser?: React.RefObject<AnalyserNode | null>;
  metricsRef?: React.RefObject<AudioMetrics> | React.MutableRefObject<AudioMetrics>;
  isPlaying?: boolean;
  /** Either a new MoodKey or a legacy palette key. */
  palette?: string;
  personality?: AuraPersonality | MoodKey;
  /** Full AuraProfile — when provided, palette colors come from profile.colors. */
  profile?: AuraProfile;
  particles?: boolean;
  /** Hero mode: self-animates with synthetic waveform when no analyser is given. */
  hero?: boolean;
  /** When false, the vocal band is not drawn (instrumental tracks). */
  hasVocals?: boolean;
  /** Per-band visibility / color / intensity configuration. */
  bands?: BandsConfig | null;
  /** Atmospheric effect layer — auto-picked per Aura. */
  effect?: AuraEffect | null;
};

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}



function shapeStyle(shape: AuraPersonality["shape"]): React.CSSProperties {
  switch (shape) {
    case "oval":
      return { borderRadius: "50%", transform: "scaleY(0.86)" };
    case "tall":
      return { borderRadius: "48% 52% 46% 54% / 60% 60% 40% 40%" };
    case "wide":
      return { borderRadius: "50%", transform: "scaleX(1.12) scaleY(0.92)" };
    case "soft-blob":
      return { borderRadius: "58% 42% 54% 46% / 50% 56% 44% 50%" };
    default:
      return { borderRadius: "50%" };
  }
}

function motionAnimation(motion: AuraPersonality["motion"], speed: number, playing: boolean) {
  // Returns a base animation for the outer shell.
  const dur = 24 / speed;
  switch (motion) {
    case "pulse":
      return playing ? `aura-pulse ${6 / speed}s ease-in-out infinite` : `aura-breathe 6s ease-in-out infinite`;
    case "tide":
      return `aura-tide ${10 / speed}s ease-in-out infinite, aura-spin ${dur}s linear infinite`;
    case "shimmer":
      return `aura-spin ${dur * 0.6}s linear infinite`;
    case "drift":
      return `aura-drift ${12 / speed}s ease-in-out infinite, aura-spin ${dur * 1.4}s linear infinite`;
    case "smoke":
      return `aura-spin ${dur * 1.4}s linear infinite, aura-smoke ${9 / speed}s ease-in-out infinite`;
    case "breathe":
    default:
      return `aura-spin ${dur}s linear infinite`;
  }
}

export function OrbVisual({
  size = 320,
  hueShift = 0,
  intensity = 1,
  className,
  analyser,
  metricsRef,
  isPlaying = false,
  palette,
  personality,
  profile,
  particles = true,
  hero = false,
  hasVocals = true,
  bands,
  effect = null,
}: Props) {

  const ref = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const textureRef = useRef<HTMLDivElement>(null);
  const ringCanvasRef = useRef<HTMLCanvasElement>(null);
  const fxCanvasRef = useRef<HTMLCanvasElement>(null);
  const filterId = useId().replace(/:/g, "");

  const p: AuraPersonality = useMemo(() => {
    const base =
      typeof personality === "object"
        ? personality!
        : getPersonality(
            (typeof personality === "string" ? personality : undefined) ?? palette ?? profile?.palette,
          );
    if (!profile) return base;
    const c = profile.colors;
    return {
      ...base,
      stops: [c.primary, c.secondary, c.accent, c.glow, c.primary] as AuraPersonality["stops"],
      swatches: c.swatches,
      glow: c.glow,
      atmosphere: c.shadow,
    };
  }, [personality, palette, profile]);

  const bandsCfg = useMemo(() => resolveBands(bands), [bands]);

  // Resolve a band's stroke color: "auto" falls back to the palette default.
  const bandColor = useMemo(() => {
    const autoColor: Record<BandKey, string> = {
      waveform: p.stops[3],
      bass: p.stops[1],
      radar: p.stops[1],
      vocal: p.glow,
    };
    return (key: BandKey) => {
      const c = bandsCfg[key].color;
      return c && c !== "auto" ? c : autoColor[key];
    };
  }, [bandsCfg, p.stops, p.glow]);



  // Drive CSS vars from metrics (preferred) or analyser (fallback).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!metricsRef && !analyser?.current) return;

    let raf = 0;
    // smoothed values for var output
    let scale = 1;
    let glow = 0.6;
    let bassHalo = 1;
    let shimmer = 0.5;
    let deform = 0;
    let vocalLevel = 0;
    let burst = 0;
    // Radar pings are emitted on detected onsets (real audio) — each entry is
    // an expanding ring with its own life.
    const radarRings: { r: number; life: number }[] = [];
    let onsetCooldown = 0;
    // Spectral-flux onset detection state (adaptive threshold).
    let prevSpectrum: Float32Array | null = null;
    let fluxAvg = 0;
    let fluxVar = 0;
    // Independent slow rotation so the vocal core never phase-locks to the
    // full-mix waveform ring.
    let corePhase = 0;
    // Auto-gain so quiet masters still move the waveform ring.
    let volCeiling = 0.12;
    // Slow low-band envelope for the bass halo.
    let bassEnv = 0;

    // fallback analyser-only state
    const a = analyser?.current ?? null;
    const freq = a ? new Uint8Array(a.frequencyBinCount) : null;
    const wave = a ? new Uint8Array(a.fftSize) : null;
    // Real nyquist — bin→Hz mapping must never assume 44.1kHz.
    const nyquist = (a?.context?.sampleRate ?? 44100) / 2;

    const tick = () => {
      let vol = 0;
      let bass = 0;
      let mid = 0;
      let treble = 0;
      let peak = 0;
      let trans = 0;

      if (metricsRef?.current?.ready) {
        const m = metricsRef.current;
        vol = m.volume;
        bass = m.bass;
        mid = m.mid;
        treble = m.treble;
        peak = m.peak;
        trans = m.transient;
      } else if (a && freq && wave) {
        a.getByteTimeDomainData(wave);
        a.getByteFrequencyData(freq);
        let min = 255;
        let max = 0;
        let sumSq = 0;
        for (let i = 0; i < wave.length; i += 4) {
          const v = wave[i];
          if (v < min) min = v;
          if (v > max) max = v;
          const c = (v - 128) / 128;
          sumSq += c * c;
        }
        peak = (max - min) / 255;
        vol = Math.sqrt(sumSq / (wave.length / 4));
        const n = freq.length;
        const bEnd = Math.floor(n * 0.08);
        const mEnd = Math.floor(n * 0.35);
        let bs = 0;
        let ms = 0;
        let ts = 0;
        for (let i = 0; i < bEnd; i++) bs += freq[i];
        for (let i = bEnd; i < mEnd; i++) ms += freq[i];
        for (let i = mEnd; i < n; i++) ts += freq[i];
        bass = bs / Math.max(1, bEnd) / 255;
        mid = ms / Math.max(1, mEnd - bEnd) / 255;
        treble = ts / Math.max(1, n - mEnd) / 255;
      }

      // Targets
      const tScale = 1 + Math.min(0.22, vol * 0.55 + peak * 0.1);
      const tGlow = 0.55 + (vol * 0.8 + mid * 0.6);
      const tBass = 1 + Math.min(0.36, bass * 0.55);
      const tShim = 0.4 + treble * 1.8;
      const tDeform = Math.min(22, peak * 22);

      // Lerp envelopes
      scale += (tScale - scale) * 0.18;
      glow += (tGlow - glow) * 0.18;
      bassHalo += (tBass - bassHalo) * 0.22;
      shimmer += (tShim - shimmer) * 0.2;
      deform += (tDeform - deform) * 0.28;
      burst = Math.max(burst * 0.86, trans);

      el.style.setProperty("--orb-scale", scale.toFixed(3));
      el.style.setProperty("--orb-glow", glow.toFixed(3));
      el.style.setProperty("--orb-bass", bassHalo.toFixed(3));
      el.style.setProperty("--orb-shimmer", shimmer.toFixed(3));
      el.style.setProperty("--orb-deform", deform.toFixed(2));
      el.style.setProperty("--orb-burst", burst.toFixed(3));

      // Pull waveform once
      const waveData =
        metricsRef?.current?.waveform ??
        (a && wave ? (a.getByteTimeDomainData(wave!), wave) : null);
      const freqData = metricsRef?.current?.frequency ?? freq;

      // Edge clip-path deformation on the shell + texture (oscilloscope silhouette)
      if (waveData && waveData.length > 0 && (shellRef.current || textureRef.current)) {
        const N = 36;
        const step = waveData.length / N;
        const amp = 0.05 + Math.min(0.18, vol * 0.45 + peak * 0.18);
        let pts = "";
        for (let i = 0; i < N; i++) {
          const v = (waveData[Math.floor(i * step)] - 128) / 128;
          const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
          const r = 0.5 + v * amp;
          const x = (50 + Math.cos(angle) * r * 100).toFixed(2);
          const y = (50 + Math.sin(angle) * r * 100).toFixed(2);
          pts += `${x}% ${y}%${i < N - 1 ? "," : ""}`;
        }
        const clip = `polygon(${pts})`;
        if (shellRef.current) shellRef.current.style.clipPath = clip;
        if (textureRef.current) textureRef.current.style.clipPath = clip;
      }

      // Draw oscilloscope rings
      const canvas = ringCanvasRef.current;
      if (canvas && waveData && waveData.length > 0) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const dpr = Math.min(2, window.devicePixelRatio || 1);
          const rect = canvas.getBoundingClientRect();
          const need =
            canvas.width !== Math.floor(rect.width * dpr) ||
            canvas.height !== Math.floor(rect.height * dpr);
          if (need) {
            canvas.width = Math.floor(rect.width * dpr);
            canvas.height = Math.floor(rect.height * dpr);
          }
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);
          const cx = w / 2;
          const cy = h / 2;
          const baseR = Math.min(w, h) * 0.42;
          // Auto-gain: track a slowly-decaying loudness ceiling so quiet
          // masters still trace a visible ring.
          volCeiling = Math.max(vol, volCeiling * 0.9995);
          const volN = Math.min(1, vol / Math.max(0.05, volCeiling));
          const deformGain = baseR * (0.22 + volN * 0.22) + deform * 1.1;
          const samples = 220;
          const step2 = waveData.length / samples;

          // Band 1 — WAVEFORM RING: full-mix time domain, normalised.
          if (bandsCfg.waveform.enabled) {
            const g = bandGain(bandsCfg.waveform.intensity);
            ctx.lineWidth = 2.2 * dpr * g.width;
            ctx.strokeStyle = bandColor("waveform");
            ctx.shadowBlur = 14 * dpr * g.glow;
            ctx.shadowColor = p.glow;
            ctx.globalAlpha = Math.min(1, (0.4 + volN * 0.55) * g.alpha);
            ctx.beginPath();
            for (let i = 0; i <= samples; i++) {
              const idx = Math.floor((i % samples) * step2);
              const v = (waveData[idx] - 128) / 128;
              const angle = (i / samples) * Math.PI * 2;
              const r = baseR + v * deformGain;
              const x = cx + Math.cos(angle) * r;
              const y = cy + Math.sin(angle) * r;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
          }

          // Band 2 — BASS HALO: only bins below 200 Hz, mapped with the real
          // sample rate. Slow envelope, so it swells with the kick and sub.
          if (bandsCfg.bass.enabled) {
            const g = bandGain(bandsCfg.bass.intensity);
            ctx.lineWidth = 1.2 * dpr * g.width;
            ctx.strokeStyle = bandColor("bass");
            ctx.shadowBlur = 0;
            const bn = freqData ? freqData.length : 0;
            const bLo = bn ? Math.max(1, Math.floor((20 / nyquist) * bn)) : 0;
            const bHi = bn ? Math.max(bLo + 1, Math.floor((200 / nyquist) * bn)) : 0;
            const bSpan = bHi - bLo;
            // Measure the low band directly rather than trusting a generic
            // "bass" metric that may include low mids.
            let lowLevel = bass;
            if (freqData && bSpan > 0) {
              let s = 0;
              for (let i = bLo; i <= bHi; i++) s += freqData[i];
              lowLevel = s / (bSpan + 1) / 255;
            }
            bassEnv += (lowLevel - bassEnv) * (lowLevel > bassEnv ? 0.3 : 0.08);
            ctx.globalAlpha = Math.min(1, (0.18 + Math.min(0.45, bassEnv * 1.6)) * g.alpha);
            const baseR2 = baseR * (1.06 + bassEnv * 0.14);
            ctx.beginPath();
            const bSegs = 120;
            for (let i = 0; i <= bSegs; i++) {
              const u = (i % bSegs) / bSegs;
              // Mirror the low band around the circle so the ring stays smooth.
              const m = u < 0.5 ? u * 2 : (1 - u) * 2;
              let v = 0;
              if (freqData && bSpan > 0) {
                v = freqData[bLo + Math.floor(m * (bSpan - 1))] / 255;
              }
              const angle = u * Math.PI * 2 + 0.12;
              const r = baseR2 + v * baseR * 0.16 * (0.4 + bassEnv * 1.6);
              const x = cx + Math.cos(angle) * r;
              const y = cy + Math.sin(angle) * r;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
          }

          // Band 3 — RADAR PINGS: true spectral-flux onset detection with an
          // adaptive threshold, so rings fire on attacks rather than loudness.
          if (bandsCfg.radar.enabled) {
            const g = bandGain(bandsCfg.radar.intensity);
            let flux = 0;
            if (freqData && freqData.length > 0) {
              const n = freqData.length;
              if (!prevSpectrum || prevSpectrum.length !== n) {
                prevSpectrum = new Float32Array(n);
                for (let i = 0; i < n; i++) prevSpectrum[i] = freqData[i];
              } else {
                let sum = 0;
                for (let i = 0; i < n; i++) {
                  const d = freqData[i] - prevSpectrum[i];
                  if (d > 0) sum += d;
                  prevSpectrum[i] = prevSpectrum[i] + (freqData[i] - prevSpectrum[i]) * 0.55;
                }
                flux = sum / (n * 255);
              }
            }
            // Running mean + variance → threshold adapts to the track.
            const d = flux - fluxAvg;
            fluxAvg += d * 0.05;
            fluxVar += (d * d - fluxVar) * 0.05;
            const threshold = fluxAvg + Math.sqrt(Math.max(fluxVar, 1e-9)) * 1.6 + 0.0015;
            onsetCooldown = Math.max(0, onsetCooldown - 1);
            const onset = flux > threshold || trans > 0.45;
            if (onset && onsetCooldown === 0 && radarRings.length < 6) {
              radarRings.push({ r: baseR * 0.55, life: 1 });
              onsetCooldown = 7;
            }
            ctx.shadowBlur = 0;
            ctx.lineWidth = 1.1 * dpr * g.width;
            ctx.strokeStyle = bandColor("radar");
            for (let i = radarRings.length - 1; i >= 0; i--) {
              const ring = radarRings[i];
              ring.r += baseR * 0.018;
              ring.life -= 0.02;
              if (ring.life <= 0) {
                radarRings.splice(i, 1);
                continue;
              }
              ctx.globalAlpha = Math.min(1, ring.life * 0.45 * g.alpha);
              ctx.beginPath();
              ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
              ctx.stroke();
            }
          }


          // Vocal band: driven by energy in the vocal range (~200Hz–4kHz),
          // with the low band subtracted so kick/808 bleed can't pump it.
          if (hasVocals && bandsCfg.vocal.enabled) {
            const g = bandGain(bandsCfg.vocal.intensity);
            let vocal = 0;
            let vLo = 0;
            let vHi = 0;
            if (freqData && freqData.length > 0) {
              const n = freqData.length;
              // Nyquist ~22.05kHz for a 44.1kHz context.
              vLo = Math.max(1, Math.floor((200 / 22050) * n));
              vHi = Math.min(n - 1, Math.floor((4000 / 22050) * n));
              let sum = 0;
              for (let i = vLo; i <= vHi; i++) sum += freqData[i];
              vocal = sum / Math.max(1, vHi - vLo + 1) / 255;
              // Duck by low-end energy: bass belongs to the halo, not the core.
              vocal = Math.max(0, vocal - bass * 0.45);
            }
            // Fast attack, slow release — a voice-like envelope.
            vocalLevel += (vocal - vocalLevel) * (vocal > vocalLevel ? 0.4 : 0.06);
            const amp = Math.min(1, vocalLevel * 2.6);
            corePhase += 0.0035 + amp * 0.004;


            if (amp > 0.02) {
              const solid = bandsCfg.vocal.color !== "auto" ? bandsCfg.vocal.color : null;
              ctx.shadowBlur = 22 * dpr * g.glow;
              ctx.shadowColor = solid ?? p.glow;
              ctx.globalAlpha = Math.min(1, (0.25 + amp * 0.8) * g.alpha);

              if (bandsCfg.vocalShape === "core") {
                const coreR = baseR * (0.4 + amp * 0.22);
                let stroke: string | CanvasGradient = solid ?? "";
                if (!solid) {
                  const rg = ctx.createRadialGradient(cx, cy, coreR * 0.2, cx, cy, coreR * 1.15);
                  rg.addColorStop(0, p.glow);
                  rg.addColorStop(1, p.stops[2]);
                  stroke = rg;
                }
                ctx.strokeStyle = stroke;
                ctx.lineWidth = (1.6 + amp * 2.4) * dpr * g.width;
                ctx.beginPath();
                const segs = 180;
                const vSpan = Math.max(1, vHi - vLo);
                for (let i = 0; i <= segs; i++) {
                  const u = i / segs;
                  const angle = u * Math.PI * 2 + corePhase;
                  // Shape comes from the VOCAL spectrum only (mirrored around
                  // the circle), never from the full-mix waveform.
                  const m = u < 0.5 ? u * 2 : (1 - u) * 2;
                  const s = freqData ? freqData[vLo + Math.floor(m * (vSpan - 1))] / 255 : 0;
                  const v = s - vocalLevel;
                  const r = coreR * (1 + v * 0.55 * (0.4 + amp));
                  const x = cx + Math.cos(angle) * r;
                  const y = cy + Math.sin(angle) * r;
                  if (i === 0) ctx.moveTo(x, y);
                  else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.stroke();

              } else {
                const streakW = baseR * 2.6;
                const streakX0 = cx - streakW / 2;
                let stroke: string | CanvasGradient = solid ?? "";
                if (!solid) {
                  const grad = ctx.createLinearGradient(streakX0, cy, streakX0 + streakW, cy);
                  grad.addColorStop(0, "transparent");
                  grad.addColorStop(0.2, p.stops[2]);
                  grad.addColorStop(0.5, p.glow);
                  grad.addColorStop(0.8, p.stops[3]);
                  grad.addColorStop(1, "transparent");
                  stroke = grad;
                }
                ctx.strokeStyle = stroke;
                ctx.lineWidth = (1.6 + amp * 1.4) * dpr * g.width;
                ctx.beginPath();
                const segs = 240;
                const vSpan = Math.max(1, vHi - vLo);
                for (let i = 0; i <= segs; i++) {
                  const u = i / segs;
                  // Vocal-only contour, alternating sign for a waveform look.
                  const s = freqData ? freqData[vLo + Math.floor(u * (vSpan - 1))] / 255 : 0;
                  const v = (s - vocalLevel) * (i % 2 === 0 ? 1 : -1) * 2.2;
                  const x = streakX0 + u * streakW;
                  const env = Math.exp(-Math.pow((u - 0.5) * 2.4, 2));
                  const y = cy + v * baseR * 0.55 * env * (0.35 + amp);
                  if (i === 0) ctx.moveTo(x, y);
                  else ctx.lineTo(x, y);
                }
                ctx.stroke();
              }
            }
          }


          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [analyser, metricsRef, isPlaying, p.motion, p.stops, p.glow, hasVocals, bandsCfg, bandColor]);

  // Hero mode: synthetic self-animation when no real audio is connected.
  useEffect(() => {
    if (!hero) return;
    if (metricsRef?.current?.ready) return;
    if (analyser?.current) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const start = performance.now();
    const N = 256;
    const wave = new Uint8Array(N);
    let scale = 1, glow = 0.6, bassHalo = 1, shimmer = 0.5, deform = 8, burst = 0;

    const tick = (now: number) => {
      const t = (now - start) / 1000;

      // Synthetic envelopes (slow breathing + occasional swells)
      const breath = 0.5 + 0.5 * Math.sin(t * 0.9);
      const swell = 0.5 + 0.5 * Math.sin(t * 0.31 + 1.3);
      const sparkle = 0.5 + 0.5 * Math.sin(t * 1.7 + 0.4);
      const beat = Math.max(0, Math.sin(t * 2.1)) ** 6;

      const tScale = 1 + 0.06 * breath + 0.04 * swell + 0.05 * beat;
      const tGlow = 0.7 + 0.5 * breath + 0.25 * swell;
      const tBass = 1 + 0.12 * swell + 0.16 * beat;
      const tShim = 0.7 + 1.1 * sparkle;
      const tDef = 6 + 8 * breath + 6 * beat;
      const tBurst = beat * 0.7;

      scale += (tScale - scale) * 0.12;
      glow += (tGlow - glow) * 0.12;
      bassHalo += (tBass - bassHalo) * 0.16;
      shimmer += (tShim - shimmer) * 0.14;
      deform += (tDef - deform) * 0.18;
      burst = Math.max(burst * 0.9, tBurst);

      el.style.setProperty("--orb-scale", scale.toFixed(3));
      el.style.setProperty("--orb-glow", glow.toFixed(3));
      el.style.setProperty("--orb-bass", bassHalo.toFixed(3));
      el.style.setProperty("--orb-shimmer", shimmer.toFixed(3));
      el.style.setProperty("--orb-deform", deform.toFixed(2));
      el.style.setProperty("--orb-burst", burst.toFixed(3));

      // Synthetic waveform: sum of sines with slow drift, used by canvas + clip-path.
      for (let i = 0; i < N; i++) {
        const x = i / N;
        const v =
          Math.sin(x * Math.PI * 18 + t * 3.2) * 0.55 +
          Math.sin(x * Math.PI * 6 + t * 1.1) * 0.3 +
          Math.sin(x * Math.PI * 42 + t * 5.7) * 0.18;
        // Equator emphasis: amplify around the middle (creates the bright streak).
        const env = Math.exp(-Math.pow((x - 0.5) * 3.4, 2));
        const sample = v * (0.55 + env * 0.7);
        wave[i] = Math.max(0, Math.min(255, Math.round(128 + sample * 90)));
      }

      // Edge clip-path deformation
      if (shellRef.current || textureRef.current) {
        const M = 36;
        const step = N / M;
        const amp = 0.05 + 0.06 * breath + 0.05 * beat;
        let pts = "";
        for (let i = 0; i < M; i++) {
          const v = (wave[Math.floor(i * step)] - 128) / 128;
          const angle = (i / M) * Math.PI * 2 - Math.PI / 2;
          const r = 0.5 + v * amp;
          const x = (50 + Math.cos(angle) * r * 100).toFixed(2);
          const y = (50 + Math.sin(angle) * r * 100).toFixed(2);
          pts += `${x}% ${y}%${i < M - 1 ? "," : ""}`;
        }
        const clip = `polygon(${pts})`;
        if (shellRef.current) shellRef.current.style.clipPath = clip;
        if (textureRef.current) textureRef.current.style.clipPath = clip;
      }

      // Canvas: orbit oscilloscope + horizontal equator streak + expanding rings.
      const canvas = ringCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const dpr = Math.min(2, window.devicePixelRatio || 1);
          const rect = canvas.getBoundingClientRect();
          if (
            canvas.width !== Math.floor(rect.width * dpr) ||
            canvas.height !== Math.floor(rect.height * dpr)
          ) {
            canvas.width = Math.floor(rect.width * dpr);
            canvas.height = Math.floor(rect.height * dpr);
          }
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);
          const cx = w / 2;
          const cy = h / 2;
          const baseR = Math.min(w, h) * 0.42;

          // Orbit oscilloscope
          if (bandsCfg.waveform.enabled) {
            const g = bandGain(bandsCfg.waveform.intensity);
            const samples = 220;
            ctx.lineWidth = 2 * dpr * g.width;
            ctx.strokeStyle = bandColor("waveform");
            ctx.shadowBlur = 14 * dpr * g.glow;
            ctx.shadowColor = p.glow;
            ctx.globalAlpha = Math.min(1, (0.5 + 0.25 * breath) * g.alpha);
            ctx.beginPath();
            for (let i = 0; i <= samples; i++) {
              const idx = Math.floor((i % samples) * (N / samples));
              const v = (wave[idx] - 128) / 128;
              const angle = (i / samples) * Math.PI * 2;
              const r = baseR + v * (baseR * 0.32);
              const x = cx + Math.cos(angle) * r;
              const y = cy + Math.sin(angle) * r;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
          }

          // Expanding rings (radar-style)
          if (bandsCfg.radar.enabled) {
            const g = bandGain(bandsCfg.radar.intensity);
            const ringCount = 3;
            for (let k = 0; k < ringCount; k++) {
              const phase = (t * 0.35 + k / ringCount) % 1;
              const rr = baseR * (0.7 + phase * 0.7);
              const alpha = (1 - phase) * 0.35 * g.alpha;
              ctx.globalAlpha = Math.min(1, alpha);
              ctx.lineWidth = 1.2 * dpr * g.width;
              ctx.strokeStyle = bandColor("radar");
              ctx.shadowBlur = 0;
              ctx.beginPath();
              ctx.ellipse(cx, cy, rr, rr * 0.92, 0, 0, Math.PI * 2);
              ctx.stroke();
            }
          }

          // Vocal band — centered core pulse or equator streak. Uses its own
          // slower "voice" oscillator, independent of the mix waveform above.
          if (hasVocals && bandsCfg.vocal.enabled) {
            const g = bandGain(bandsCfg.vocal.intensity);
            const amp = 0.4 + 0.4 * swell;
            const vAt = (u: number) =>
              Math.sin(u * Math.PI * 5 + t * 1.35) * 0.6 +
              Math.sin(u * Math.PI * 11 - t * 0.75) * 0.4;
            const solid = bandsCfg.vocal.color !== "auto" ? bandsCfg.vocal.color : null;
            ctx.shadowBlur = 22 * dpr * g.glow;
            ctx.shadowColor = solid ?? p.glow;
            ctx.globalAlpha = Math.min(1, 0.95 * g.alpha);

            if (bandsCfg.vocalShape === "core") {
              const coreR = baseR * (0.44 + amp * 0.18);
              const grad =
                solid ??
                (() => {
                  const rg = ctx.createRadialGradient(cx, cy, coreR * 0.2, cx, cy, coreR * 1.15);
                  rg.addColorStop(0, p.glow);
                  rg.addColorStop(1, p.stops[2]);
                  return rg;
                })();
              ctx.strokeStyle = grad as string | CanvasGradient;
              ctx.lineWidth = (1.8 + amp * 2.2) * dpr * g.width;
              ctx.beginPath();
              const segs = 180;
              for (let i = 0; i <= segs; i++) {
                const u = i / segs;
                const angle = u * Math.PI * 2 + t * 0.22;
                const v = vAt(u);
                const r = coreR * (1 + v * 0.16 * (0.5 + amp));
                const x = cx + Math.cos(angle) * r;
                const y = cy + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
              ctx.closePath();
              ctx.stroke();

            } else {
              const streakW = baseR * 2.6;
              const streakX0 = cx - streakW / 2;
              let stroke: string | CanvasGradient = solid ?? "";
              if (!solid) {
                const grad = ctx.createLinearGradient(streakX0, cy, streakX0 + streakW, cy);
                grad.addColorStop(0, "transparent");
                grad.addColorStop(0.2, p.stops[2]);
                grad.addColorStop(0.5, p.glow);
                grad.addColorStop(0.8, p.stops[3]);
                grad.addColorStop(1, "transparent");
                stroke = grad;
              }
              ctx.strokeStyle = stroke;
              ctx.lineWidth = 2.2 * dpr * g.width;
              ctx.beginPath();
              const segs = 240;
              for (let i = 0; i <= segs; i++) {
                const u = i / segs;
                const v = vAt(u) * (0.5 + amp * 0.6);
                const x = streakX0 + u * streakW;
                const env = Math.exp(-Math.pow((u - 0.5) * 2.4, 2));
                const y = cy + v * baseR * 0.55 * env;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
              ctx.stroke();
            }
          }


          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hero, analyser, metricsRef, p.stops, p.glow, hasVocals, bandsCfg, bandColor]);

  // Idle micro-motion: keeps every orb quietly alive when nothing is playing.
  useEffect(() => {
    if (hero) return;
    if (isPlaying) return;
    if (prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const start = performance.now();
    const phase = ((hueShift % 97) / 97) * Math.PI * 2;
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      const breathe = Math.sin(t * 0.55 + phase);
      const slow = Math.sin(t * 0.23 + phase * 1.7);
      el.style.setProperty("--orb-scale", (1 + breathe * 0.012).toFixed(4));
      el.style.setProperty("--orb-glow", (0.5 + breathe * 0.12).toFixed(3));
      el.style.setProperty("--orb-bass", (1 + slow * 0.03).toFixed(4));
      el.style.setProperty("--orb-shimmer", (0.45 + slow * 0.12).toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hero, isPlaying, hueShift]);

  // Atmosphere layer — smoke / water / ember / lightning. Deterministic per
  // Aura, gently modulated by live audio when it is available.
  useEffect(() => {
    if (!effect) return;
    if (prefersReducedMotion()) return;
    const canvas = fxCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    const start = performance.now();
    let seed = Math.abs(Math.floor(hueShift)) + 7;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    type Particle = { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number };
    const parts: Particle[] = [];
    let arcs: { t: number; pts: { x: number; y: number }[] }[] = [];
    let arcCooldown = 0;

    const energyNow = () => {
      const m = metricsRef?.current;
      if (m?.ready) return Math.min(1, m.volume * 2.2);
      return 0.28;
    };

    const spawn = (w: number, h: number, e: number) => {
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.42;
      if (effect === "smoke") {
        if (parts.length < 46) {
          const a = rnd() * Math.PI * 2;
          const d = R * (0.2 + rnd() * 0.7);
          parts.push({
            x: cx + Math.cos(a) * d,
            y: cy + Math.sin(a) * d,
            vx: (rnd() - 0.5) * 0.25 * dpr,
            vy: -(0.15 + rnd() * 0.35) * dpr * (0.6 + e),
            r: (10 + rnd() * 26) * dpr,
            life: 0,
            max: 130 + rnd() * 120,
          });
        }
      } else if (effect === "ember") {
        if (parts.length < 60) {
          const a = rnd() * Math.PI * 2;
          const d = R * (0.1 + rnd() * 0.6);
          parts.push({
            x: cx + Math.cos(a) * d,
            y: cy + Math.sin(a) * d * 0.6 + R * 0.25,
            vx: (rnd() - 0.5) * 0.4 * dpr,
            vy: -(0.5 + rnd() * 1.1) * dpr * (0.7 + e * 1.3),
            r: (1 + rnd() * 2.4) * dpr,
            life: 0,
            max: 60 + rnd() * 70,
          });
        }
      }
    };

    const tick = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (canvas.width !== Math.floor(rect.width * dpr)) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
      }
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.42;
      const t = (performance.now() - start) / 1000;
      const e = energyNow();

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      // Everything stays inside the sphere.
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      if (effect === "water") {
        ctx.globalCompositeOperation = "screen";
        for (let i = 0; i < 3; i++) {
          const phase = t * (0.35 + i * 0.12) + i * 1.9;
          ctx.beginPath();
          ctx.lineWidth = (1.1 + i * 0.5) * dpr;
          ctx.strokeStyle = i % 2 === 0 ? p.glow : p.stops[2];
          ctx.globalAlpha = 0.1 + 0.12 * e;
          for (let x = -R; x <= R; x += R / 32) {
            const amp = R * (0.035 + 0.05 * e) * (1 - Math.abs(x) / (R * 1.4));
            const y = Math.sin(x / (R * 0.28) + phase) * amp + (i - 1) * R * 0.3;
            if (x === -R) ctx.moveTo(cx + x, cy + y);
            else ctx.lineTo(cx + x, cy + y);
          }
          ctx.stroke();
        }
        // Slow caustic bloom
        const g = ctx.createRadialGradient(
          cx + Math.sin(t * 0.4) * R * 0.25,
          cy + Math.cos(t * 0.31) * R * 0.25,
          0,
          cx,
          cy,
          R,
        );
        g.addColorStop(0, p.glow);
        g.addColorStop(1, "transparent");
        ctx.globalAlpha = 0.12 + e * 0.12;
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      } else if (effect === "lightning") {
        ctx.globalCompositeOperation = "screen";
        arcCooldown -= 1;
        const m = metricsRef?.current;
        const hit = (m?.ready ? m.transient > 0.5 : rnd() > 0.988) && arcCooldown <= 0;
        if (hit && arcs.length < 3) {
          const a0 = rnd() * Math.PI * 2;
          const a1 = a0 + Math.PI * (0.6 + rnd() * 0.8);
          const pts: { x: number; y: number }[] = [];
          const segs = 9;
          for (let i = 0; i <= segs; i++) {
            const u = i / segs;
            const a = a0 + (a1 - a0) * u;
            const rr = R * (1 - u * 0.15) * (0.35 + 0.6 * Math.sin(u * Math.PI));
            pts.push({
              x: cx + Math.cos(a) * rr + (rnd() - 0.5) * R * 0.16,
              y: cy + Math.sin(a) * rr + (rnd() - 0.5) * R * 0.16,
            });
          }
          arcs.push({ t: 1, pts });
          arcCooldown = 14;
        }
        arcs = arcs.filter((arc) => arc.t > 0);
        for (const arc of arcs) {
          arc.t -= 0.06;
          ctx.globalAlpha = Math.max(0, arc.t) * 0.9;
          ctx.strokeStyle = p.glow;
          ctx.shadowColor = p.glow;
          ctx.shadowBlur = 18 * dpr;
          ctx.lineWidth = 1.6 * dpr;
          ctx.beginPath();
          arc.pts.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        // Charged haze between strikes
        ctx.globalAlpha = 0.06 + e * 0.06;
        ctx.fillStyle = p.stops[1];
        ctx.fillRect(0, 0, w, h);
      } else {
        // smoke / ember — particle systems
        spawn(w, h, e);
        ctx.globalCompositeOperation = effect === "ember" ? "screen" : "source-over";
        for (let i = parts.length - 1; i >= 0; i--) {
          const pt = parts[i];
          pt.life += 1;
          pt.x += pt.vx + Math.sin((t + i) * 0.6) * 0.25 * dpr;
          pt.y += pt.vy;
          if (pt.life > pt.max) {
            parts.splice(i, 1);
            continue;
          }
          const u = pt.life / pt.max;
          const fade = Math.sin(u * Math.PI);
          if (effect === "smoke") {
            const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.r * (1 + u));
            g.addColorStop(0, p.stops[1]);
            g.addColorStop(1, "transparent");
            ctx.globalAlpha = fade * (0.10 + e * 0.10);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.r * (1 + u), 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.globalAlpha = fade * (0.5 + e * 0.4);
            ctx.fillStyle = p.glow;
            ctx.shadowColor = p.glow;
            ctx.shadowBlur = 8 * dpr;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.shadowBlur = 0;
      }

      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [effect, hueShift, metricsRef, p.glow, p.stops]);


  const dim = typeof size === "number" ? `${size}px` : size;
  const [s0, s1, s2, s3, s4] = p.stops;

  const conic = `conic-gradient(from 180deg at 50% 50%, ${s0}, ${s1}, ${s2}, ${s3}, ${s4}, ${s0})`;
  const innerHighlight = `radial-gradient(circle at 35% 30%, ${s4} 0%, ${s2} 38%, ${s0} 72%, transparent 92%)`;
  const outerGlow = `radial-gradient(circle at 50% 50%, ${p.glow}, ${s0} 38%, transparent 72%)`;

  const shape = shapeStyle(p.shape);
  const motionAnim = motionAnimation(p.motion, p.speed, isPlaying);

  const particleCount = Math.max(0, Math.min(28, p.particleCount));

  return (
    <div
      ref={ref}
      className={cn("relative shrink-0", className)}
      style={
        {
          width: dim,
          height: dim,
          transform: "scale(var(--orb-scale, 1))",
          transition: "transform 0.08s linear",
          ["--hue" as string]: `${hueShift * 0.05 + p.hueShift}deg`,
        } as React.CSSProperties
      }
    >
      {/* SVG filters (texture overlays) */}
      <svg className="absolute -z-10" width="0" height="0" aria-hidden>
        <defs>
          <filter id={`grain-${filterId}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
          <filter id={`silk-${filterId}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.06" numOctaves="2" seed="3" />
            <feDisplacementMap in="SourceGraphic" scale="14" />
          </filter>
          <filter id={`mist-${filterId}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7" />
            <feGaussianBlur stdDeviation="6" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
          <filter id={`smoke-${filterId}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="2" />
            <feDisplacementMap in="SourceGraphic" scale="22" />
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
          <filter id={`ripple-${filterId}`}>
            <feTurbulence type="turbulence" baseFrequency="0.018 0.04" numOctaves="2" seed="5" />
            <feDisplacementMap in="SourceGraphic" scale="10" />
          </filter>
        </defs>
      </svg>

      {/* outer glow halo */}
      <div
        className="absolute inset-0 blur-3xl"
        style={{
          ...shape,
          background: outerGlow,
          opacity: `calc(0.65 * ${intensity} * var(--orb-glow, 1))`,
          transform: "scale(var(--orb-bass, 1))",
        }}
      />

      {/* outer shell (conic) */}
      <div
        ref={shellRef}
        className="absolute inset-[7%]"
        style={{
          ...shape,
          background: conic,
          filter: `blur(2px) hue-rotate(var(--hue))`,
          animation: motionAnim,
        }}
      />

      {/* texture overlay */}
      {p.texture !== "smooth" && (
        <div
          ref={textureRef}
          className="absolute inset-[8%] pointer-events-none"
          style={{
            ...shape,
            background: conic,
            filter: `url(#${p.texture}-${filterId}) hue-rotate(var(--hue))`,
            mixBlendMode: "overlay",
            opacity: 0.7,
          }}
        />
      )}

      {/* inner highlight core */}
      <div
        className="absolute inset-[14%]"
        style={{
          ...shape,
          background: innerHighlight,
          mixBlendMode: "screen",
          filter: `hue-rotate(var(--hue))`,
        }}
      />

      {/* sheen */}
      <div
        className="absolute inset-[18%] opacity-70"
        style={{
          ...shape,
          background:
            "radial-gradient(ellipse 50% 30% at 35% 25%, oklch(1 0 0 / 0.6), transparent 70%)",
          mixBlendMode: "screen",
        }}
      />

      {/* rim shadow */}
      <div
        className="absolute inset-[6%] pointer-events-none"
        style={{
          ...shape,
          boxShadow:
            "inset 0 0 60px oklch(0.18 0.05 290 / 0.55), inset 0 -22px 44px oklch(0.08 0.03 290 / 0.7)",
        }}
      />

      {/* oscilloscope waveform ring (uploads only) */}
      {(metricsRef || analyser || hero) && (
        <canvas
          ref={ringCanvasRef}
          className="pointer-events-none absolute inset-0 w-full h-full"
          aria-hidden
        />
      )}

      {/* transient burst flash */}
      {(metricsRef || analyser || hero) && (
        <div
          className="pointer-events-none absolute inset-0 blur-2xl"
          style={{
            ...shape,
            background: outerGlow,
            opacity: "calc(var(--orb-burst, 0) * 0.55)",
            transform: "scale(calc(1 + var(--orb-burst, 0) * 0.18))",
            transition: "opacity 0.08s linear",
          }}
        />
      )}

      {/* particles */}
      {particles && particleCount > 0 && (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ ...shape, opacity: "var(--orb-shimmer, 1)" }}
        >
          {Array.from({ length: particleCount }).map((_, i) => (
            <Particle key={i} index={i} kind={p.particle} speed={p.speed} stops={p.stops} />
          ))}
        </div>
      )}
    </div>
  );
}

function Particle({
  index,
  kind,
  speed,
  stops,
}: {
  index: number;
  kind: AuraPersonality["particle"];
  speed: number;
  stops: AuraPersonality["stops"];
}) {
  const top = `${50 + Math.sin(index * 1.4) * 44}%`;
  const left = `${50 + Math.cos(index * 1.7) * 46}%`;
  const delay = `${(index % 8) * 0.35}s`;
  const dur = `${(5 + (index % 5)) / Math.max(0.5, speed)}s`;

  switch (kind) {
    case "smoke":
      return (
        <span
          className="absolute rounded-full"
          style={{
            top,
            left,
            width: 14,
            height: 14,
            background: stops[0],
            filter: "blur(8px)",
            opacity: 0.35,
            animation: `aura-float ${dur} ease-in-out infinite`,
            animationDelay: delay,
          }}
        />
      );
    case "shimmer":
      return (
        <span
          className="absolute"
          style={{
            top,
            left,
            width: 2,
            height: 8,
            background: stops[3],
            boxShadow: `0 0 6px ${stops[3]}`,
            transform: `rotate(${index * 23}deg)`,
            opacity: 0.85,
            animation: `aura-twinkle ${dur} ease-in-out infinite`,
            animationDelay: delay,
          }}
        />
      );
    case "mist":
      return (
        <span
          className="absolute rounded-full"
          style={{
            top,
            left,
            width: 22,
            height: 22,
            background: stops[2],
            filter: "blur(12px)",
            opacity: 0.28,
            animation: `aura-float ${dur} ease-in-out infinite`,
            animationDelay: delay,
          }}
        />
      );
    case "embers":
      return (
        <span
          className="absolute rounded-full"
          style={{
            top,
            left,
            width: 3,
            height: 3,
            background: stops[1],
            boxShadow: `0 0 8px ${stops[1]}, 0 0 16px ${stops[1]}`,
            opacity: 0.85,
            animation: `aura-rise ${dur} ease-in-out infinite`,
            animationDelay: delay,
          }}
        />
      );
    case "tide":
      return (
        <span
          className="absolute"
          style={{
            top,
            left,
            width: 18,
            height: 1.5,
            background: `linear-gradient(90deg, transparent, ${stops[0]}, transparent)`,
            opacity: 0.6,
            animation: `aura-tide-streak ${dur} ease-in-out infinite`,
            animationDelay: delay,
          }}
        />
      );
    case "dust":
    default:
      return (
        <span
          className="absolute rounded-full bg-foreground/70"
          style={{
            top,
            left,
            width: 3,
            height: 3,
            opacity: 0.35,
            filter: "blur(0.5px)",
            animation: `aura-float ${dur} ease-in-out infinite`,
            animationDelay: delay,
          }}
        />
      );
  }
}
