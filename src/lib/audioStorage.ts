// Persistent audio uploads to Supabase Storage.
// Bucket: auragram-audio (private). RLS allows insert/update/delete only
// inside the user's own auth.uid() folder. Playback uses short-lived
// signed URLs minted at read time.

import { supabase } from "@/integrations/supabase/client";
import { compressAudioForUpload } from "./audioCompression";

export const AUDIO_BUCKET = "auragram-audio";
export const SIGNED_URL_TTL_SEC = 60 * 60 * 24 * 7; // 7 days
// The storage bucket enforces this cap server-side. Keep the client aware so
// we can reject before a 100 MB PUT round-trips and returns a misleading
// "row-level security" 403.
export const MAX_AUDIO_BYTES = 100 * 1024 * 1024;
const ALLOWED_EXT = /\.(mp3|wav|m4a|aac|ogg|webm|flac)$/i;

export type UploadedAudio = {
  storagePath: string;
  publicUrl: string; // (kept for shape compat — now a signed URL)
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number | null;
};

function fmtMB(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
}

export function formatAudioSize(bytes: number): string {
  return bytes < 10 * 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(2)} MB`
    : fmtMB(bytes);
}

export function validateAudioFile(file: File): string | null {
  const okType = file.type.startsWith("audio/");
  const okExt = ALLOWED_EXT.test(file.name);
  if (!okType && !okExt) {
    return "Please upload an audio file (.mp3, .wav, .m4a, .aac, .ogg, .webm, .flac).";
  }
  return null;
}

/** Translate an opaque storage error into a message that reflects the real cause. */
function friendlyStorageError(status: number | undefined, message: string, fileSize: number): string {
  const rls = /row-level security|violates.*policy/i.test(message);
  const parsedStatus = Number(message.match(/"statusCode"\s*:\s*"?(\d+)/i)?.[1]);
  if ((status === 403 || parsedStatus === 403 || rls) && rls) {
    if (fileSize > MAX_AUDIO_BYTES) {
      return `Upload rejected — the file is ${fmtMB(fileSize)} and the per-file limit is 100 MB.`;
    }
    return "Upload rejected by storage. Please sign in again, then retry the upload.";
  }
  if (status === 413) {
    return `Upload too large (${fmtMB(fileSize)}). The per-file limit is 100 MB.`;
  }
  return message || "Upload failed. Please try again.";
}


// In-memory signed-URL cache. Repeat plays and route navigations reuse a live
// URL instead of paying another round trip. Expires slightly early on purpose.
const signedCache = new Map<string, { url: string; expiresAt: number }>();
const CACHE_SAFETY_MS = 30_000;

function cacheGet(path: string): string | null {
  const hit = signedCache.get(path);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    signedCache.delete(path);
    return null;
  }
  return hit.url;
}

function cacheSet(path: string, url: string, expiresInSec: number) {
  signedCache.set(path, {
    url,
    expiresAt: Date.now() + expiresInSec * 1000 - CACHE_SAFETY_MS,
  });
}

/** Mint a short-lived signed URL for a stored audio path. Returns null on failure. */
export async function getSignedAudioUrl(
  storagePath: string | null | undefined,
  expiresInSec: number = SIGNED_URL_TTL_SEC,
): Promise<string | null> {
  if (!storagePath) return null;
  const cached = cacheGet(storagePath);
  if (cached) return cached;
  try {
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .createSignedUrl(storagePath, expiresInSec);
    if (error || !data?.signedUrl) return null;
    cacheSet(storagePath, data.signedUrl, expiresInSec);
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
  const all = Array.from(new Set(storagePaths.filter((p): p is string => !!p)));
  const out = new Map<string, string>();
  if (all.length === 0) return out;
  const paths: string[] = [];
  for (const p of all) {
    const hit = cacheGet(p);
    if (hit) out.set(p, hit);
    else paths.push(p);
  }
  if (paths.length === 0) return out;
  try {
    const { data } = await supabase.storage
      .from(AUDIO_BUCKET)
      .createSignedUrls(paths, expiresInSec);
    for (const entry of data ?? []) {
      if (entry.path && entry.signedUrl) {
        out.set(entry.path, entry.signedUrl);
        cacheSet(entry.path, entry.signedUrl, expiresInSec);
      }
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
  onStatus?: (message: string) => void;
}): Promise<UploadedAudio> {
  const { authUserId, auraId, rawRecording, onProgress, onStatus } = opts;
  let file = opts.file;
  const validation = validateAudioFile(file);
  if (validation) throw new Error(validation);
  const compressed = await compressAudioForUpload(file, MAX_AUDIO_BYTES, onStatus);
  file = compressed.file;
  if (compressed.compressed) {
    onStatus?.(`Compressed to ${formatAudioSize(file.size)} for upload.`);
  }

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
            } else {
              reject(new Error(friendlyStorageError(xhr.status, xhr.responseText || "", file.size)));
            }
          };
          xhr.onerror = () => reject(new Error("Upload network error — please check your connection and retry."));
          xhr.send(file);
        });
        uploaded = true;
      } else if (signErr) {
        // Signed-URL creation itself was rejected (usually RLS/size). Surface the real reason.
        const status = (signErr as { status?: number; statusCode?: string }).status
          ?? Number((signErr as { statusCode?: string }).statusCode);
        throw new Error(friendlyStorageError(status, signErr.message, file.size));
      }
    } catch (e) {
      if (e instanceof Error && /100 MB|per-file limit|unsupported audio/i.test(e.message)) {
        throw e; // already a friendly message — don't fall back and mask it
      }
      console.warn("[uploadAuraAudio] signed-url path failed, falling back", e);
    }
  }
  if (!uploaded) {
    const { error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(storagePath, file, { upsert: true, contentType });
    if (error) {
      const status = (error as { status?: number; statusCode?: string }).status
        ?? Number((error as { statusCode?: string }).statusCode);
      throw new Error(friendlyStorageError(status, error.message, file.size));
    }
    onProgress?.(100);
  }


  // Bucket is private now — mint a signed URL for immediate playback after upload.
  const signedUrl = await getSignedAudioUrl(storagePath);

  const durationSeconds = await probeDuration(file);

  return {
    storagePath,
    publicUrl: signedUrl ?? "",
    fileName,
    mimeType: contentType,
    sizeBytes: file.size,
    durationSeconds,
  };
}
