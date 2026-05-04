// Persistent audio uploads to Supabase Storage.
// Bucket: auragram-audio (public). RLS allows insert/update/delete only
// inside the user's own auth.uid() folder.

import { supabase } from "@/integrations/supabase/client";

export const AUDIO_BUCKET = "auragram-audio";
export const MAX_AUDIO_BYTES = 100 * 1024 * 1024; // 100 MB
const ALLOWED_EXT = /\.(mp3|wav|m4a|aac|ogg|webm|flac)$/i;

export type UploadedAudio = {
  storagePath: string;
  publicUrl: string;
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
    return "This file is too large. Try a smaller audio file (max 100 MB).";
  }
  return null;
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
}): Promise<UploadedAudio> {
  const { authUserId, auraId, file, rawRecording } = opts;
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

  const { error } = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(storagePath, file, { upsert: true, contentType });
  if (error) throw error;

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
