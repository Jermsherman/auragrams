// Persistent audio uploads to Supabase Storage.
// Bucket: auragram-audio (private). RLS allows insert/update/delete only
// inside the user's own auth.uid() folder. Playback uses short-lived
// signed URLs minted at read time.

import { supabase } from "@/integrations/supabase/client";

export const AUDIO_BUCKET = "auragram-audio";
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB — most 3-min MP3s fit
export const AUDIO_SOFT_WARN_BYTES = 20 * 1024 * 1024; // warn ≥ 20 MB
export const SIGNED_URL_TTL_SEC = 60 * 60 * 24 * 7; // 7 days
const ALLOWED_EXT = /\.(mp3|wav|m4a|aac|ogg|webm|flac)$/i;

export type UploadedAudio = {
  storagePath: string;
  publicUrl: string; // (kept for shape compat — now a signed URL)
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number | null;
};

export function validateAudioFile(file: File): string | null {
  const okType = file.type.startsWith("audio/");
  const okExt = ALLOWED_EXT.test(file.name);
  if (!okType && !okExt) {
    return "Please upload an audio file (.mp3, .wav, .m4a, .aac, .ogg, .webm).";
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return "This file is too large. Please use an audio file under 25 MB (MP3 recommended).";
  }
  return null;
}

/** Soft warning shown before submit; null if file is fine. */
export function audioSoftWarning(file: File): string | null {
  if (file.size >= AUDIO_SOFT_WARN_BYTES && file.size <= MAX_AUDIO_BYTES) {
    return "That's a large audio file — an MP3 export will upload faster and cost less to host.";
  }
  return null;
}

/** Mint a short-lived signed URL for a stored audio path. Returns null on failure. */
export async function getSignedAudioUrl(
  storagePath: string | null | undefined,
  expiresInSec: number = SIGNED_URL_TTL_SEC,
): Promise<string | null> {
  if (!storagePath) return null;
  try {
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .createSignedUrl(storagePath, expiresInSec);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

/** Batch sign many paths. Returns a Map<path, signedUrl>. Silent on failure. */
export async function getSignedAudioUrls(
  storagePaths: (string | null | undefined)[],
  expiresInSec: number = SIGNED_URL_TTL_SEC,
): Promise<Map<string, string>> {
  const paths = Array.from(new Set(storagePaths.filter((p): p is string => !!p)));
  const out = new Map<string, string>();
  if (paths.length === 0) return out;
  try {
    const { data } = await supabase.storage
      .from(AUDIO_BUCKET)
      .createSignedUrls(paths, expiresInSec);
    for (const entry of data ?? []) {
      if (entry.path && entry.signedUrl) out.set(entry.path, entry.signedUrl);
    }
  } catch {
    /* best-effort */
  }
  return out;
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "audio";
}

async function probeDuration(file: File): Promise<number | null> {
  if (typeof window === "undefined") return null;
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement("audio");
    let done = false;
    const finish = (v: number | null) => {
      if (done) return;
      done = true;
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* ignore */
      }
      resolve(v);
    };
    a.preload = "metadata";
    a.onloadedmetadata = () =>
      finish(Number.isFinite(a.duration) ? Math.round(a.duration * 100) / 100 : null);
    a.onerror = () => finish(null);
    a.src = url;
    setTimeout(() => finish(null), 8000);
  });
}

export async function uploadAuraAudio(opts: {
  authUserId: string;
  auraId: string;
  file: File;
  rawRecording?: boolean;
  onProgress?: (pct: number) => void;
}): Promise<UploadedAudio> {
  const { authUserId, auraId, file, rawRecording, onProgress } = opts;
  const validation = validateAudioFile(file);
  if (validation) throw new Error(validation);

  const fileName = rawRecording
    ? `raw-recording-${safeName(file.name || "raw.webm")}`
    : safeName(file.name);
  const storagePath = `${authUserId}/${auraId}/${fileName}`;
  const contentType =
    file.type ||
    (fileName.endsWith(".webm")
      ? "audio/webm"
      : fileName.endsWith(".mp3")
        ? "audio/mpeg"
        : "application/octet-stream");

  // Try signed-URL + XHR for real progress events. Fall back to the SDK
  // upload if signed-URL creation isn't available.
  let uploaded = false;
  if (onProgress) {
    try {
      const { data: signed, error: signErr } = await supabase.storage
        .from(AUDIO_BUCKET)
        .createSignedUploadUrl(storagePath, { upsert: true } as never);
      if (!signErr && signed?.signedUrl) {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", signed.signedUrl, true);
          xhr.setRequestHeader("Content-Type", contentType);
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
              onProgress(Math.round((ev.loaded / ev.total) * 100));
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              onProgress(100);
              resolve();
            } else reject(new Error(`Upload failed (${xhr.status})`));
          };
          xhr.onerror = () => reject(new Error("Upload network error"));
          xhr.send(file);
        });
        uploaded = true;
      }
    } catch (e) {
      console.warn("[uploadAuraAudio] signed-url path failed, falling back", e);
    }
  }
  if (!uploaded) {
    const { error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(storagePath, file, { upsert: true, contentType });
    if (error) throw error;
    onProgress?.(100);
  }

  const { data: pub } = supabase.storage
    .from(AUDIO_BUCKET)
    .getPublicUrl(storagePath);

  const durationSeconds = await probeDuration(file);

  return {
    storagePath,
    publicUrl: pub.publicUrl,
    fileName,
    mimeType: contentType,
    sizeBytes: file.size,
    durationSeconds,
  };
}
