// In-memory session store for uploaded audio (object URLs, not persisted).
// Audio File objects must NOT be stored in localStorage. We keep them in a
// module-level Map keyed by track id for the lifetime of the page session.

type Entry = {
  file: File;
  audioUrl: string;
};

const store = new Map<string, Entry>();

export function setSessionAudio(id: string, file: File, audioUrl: string) {
  // revoke previous if same id
  const prev = store.get(id);
  if (prev && prev.audioUrl !== audioUrl) {
    try {
      URL.revokeObjectURL(prev.audioUrl);
    } catch {
      /* ignore */
    }
  }
  store.set(id, { file, audioUrl });
}

export function getSessionAudio(id: string): Entry | null {
  return store.get(id) ?? null;
}

export function clearSessionAudio(id: string) {
  const prev = store.get(id);
  if (prev) {
    try {
      URL.revokeObjectURL(prev.audioUrl);
    } catch {
      /* ignore */
    }
    store.delete(id);
  }
}
