type CompressionUpdate = (message: string) => void;

const MIN_SAMPLE_RATE = 12_000;
const MAX_SAMPLE_RATE = 44_100;

function audioContextCtor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  return (
    (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ??
    null
  );
}

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

function wavBlobFromMonoBuffer(buffer: AudioBuffer): Blob {
  const samples = buffer.getChannelData(0);
  const byteLength = 44 + samples.length * 2;
  const arrayBuffer = new ArrayBuffer(byteLength);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function compressedName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").trim() || "audio";
  return `${base}-auragram-compressed.wav`;
}

export async function compressAudioForUpload(
  file: File,
  maxBytes: number,
  onStatus?: CompressionUpdate,
): Promise<{ file: File; compressed: boolean }> {
  if (file.size <= maxBytes) return { file, compressed: false };

  const Ctx = audioContextCtor();
  if (!Ctx || typeof OfflineAudioContext === "undefined") {
    throw new Error("This file is over 100 MB and this browser can't compress it automatically. Export as MP3 (192–320 kbps) and try again.");
  }

  onStatus?.("Compressing large audio before upload…");
  const ctx = new Ctx();
  let decoded: AudioBuffer | null = null;
  try {
    const raw = await file.arrayBuffer();
    decoded = await ctx.decodeAudioData(raw.slice(0));
  } catch {
    throw new Error("This file is over 100 MB, but Auragram couldn't read it for automatic compression. Export as MP3 (192–320 kbps) and try again.");
  } finally {
    void ctx.close?.();
  }

  const duration = decoded.duration;
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("This file is over 100 MB and couldn't be compressed automatically. Export as MP3 (192–320 kbps) and try again.");
  }

  const targetRate = Math.min(
    MAX_SAMPLE_RATE,
    Math.floor((maxBytes * 0.88 - 44) / Math.max(1, duration * 2)),
  );
  if (targetRate < MIN_SAMPLE_RATE) {
    throw new Error("This audio is too long to compress safely in the browser. Export as MP3 (192–320 kbps) and try again.");
  }

  onStatus?.("Optimizing audio size…");
  const offline = new OfflineAudioContext(1, Math.ceil(duration * targetRate), targetRate);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start(0);
  const rendered = await offline.startRendering();
  const blob = wavBlobFromMonoBuffer(rendered);
  const compressed = new File([blob], compressedName(file.name), {
    type: "audio/wav",
    lastModified: Date.now(),
  });

  if (compressed.size > maxBytes) {
    throw new Error("Automatic compression finished, but the file is still over 100 MB. Export as MP3 (192–320 kbps) and try again.");
  }

  return { file: compressed, compressed: true };
}