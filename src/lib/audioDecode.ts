// Shared AudioContext + single-decode helper. Lets keyDetect / analyzeFile /
// detectPitchCenter run off the same AudioBuffer instead of decoding 3×.
let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (_ctx) return _ctx;
  const Ctx = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  _ctx = new Ctx();
  return _ctx;
}

export async function decodeOnce(file: File): Promise<AudioBuffer | null> {
  const ctx = getCtx();
  if (!ctx) return null;
  try {
    const buf = await file.arrayBuffer();
    return await ctx.decodeAudioData(buf.slice(0));
  } catch (e) {
    console.warn("[decodeOnce] failed", e);
    return null;
  }
}
