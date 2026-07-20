// Persistent audio uploads to Supabase Storage.
// Bucket: auragram-audio (private). RLS allows insert/update/delete only
// inside the user's own auth.uid() folder. Playback uses short-lived
// signed URLs minted at read time.

import { supabase } from "@/integrations/supabase/client";

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

export function validateAudioFile(file: File): string | null {
  const okType = file.type.startsWith("audio/");
  const okExt = ALLOWED_EXT.test(file.name);
  if (!okType && !okExt) {
    return "Please upload an audio file (.mp3, .wav, .m4a, .aac, .ogg, .webm, .flac).";
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return `This file is ${fmtMB(file.size)} — the current per-file limit is 100 MB. Export as MP3 (192–320 kbps) and try again.`;
  }
  return null;
}

/** Translate an opaque storage error into a message that reflects the real cause. */
function friendlyStorageError(status: number | undefined, message: string, fileSize: number): string {
  const rls = /row-level security|violates.*policy/i.test(message);
  if (status === 403 && rls) {
    if (fileSize > MAX_AUDIO_BYTES) {
      return `Upload rejected — the file is ${fmtMB(fileSize)} and the per-file limit is 100 MB.`;
    }
    return "Upload rejected by storage. This usually means the file is over the 100 MB per-file limit or is an unsupported audio type.";
  }
  if (status === 413) {
    return `Upload too large (${fmtMB(fileSize)}). The per-file limit is 100 MB.`;
  }
  return message || "Upload failed. Please try again.";
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
