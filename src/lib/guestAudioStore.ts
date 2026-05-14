// Persistent storage for a guest-uploaded audio file across page reloads
// (the in-memory session.ts Map is wiped by the auth redirect). Uses
// IndexedDB so we can keep the actual Blob, not a data URL.

const DB_NAME = "auragram_guest_audio";
const STORE = "guest_audio";
const VERSION = 1;

type Entry = {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  savedAt: number;
};

function openDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function putGuestAudio(id: string, file: File): Promise<void> {
  const db = await openDB();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      const entry: Entry = {
        id,
        blob: file,
        name: file.name || "audio",
        type: file.type || "application/octet-stream",
        savedAt: Date.now(),
      };
      tx.objectStore(STORE).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
  db.close();
}

export async function getGuestAudio(
  id: string,
): Promise<{ file: File; audioUrl: string } | null> {
  const db = await openDB();
  if (!db) return null;
  const entry = await new Promise<Entry | null>((resolve) => {
    try {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve((req.result as Entry | undefined) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  db.close();
  if (!entry) return null;
  try {
    const file = new File([entry.blob], entry.name, { type: entry.type });
    const audioUrl = URL.createObjectURL(file);
    return { file, audioUrl };
  } catch {
    return null;
  }
}

export async function clearGuestAudio(id: string): Promise<void> {
  const db = await openDB();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
  db.close();
}
