import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/hooks/useAuth";
import {
  createArtistProfile, deleteArtistProfile, listMyArtistProfiles, updateArtistProfile,
} from "@/lib/cloudAura";
import type { ArtistProfile } from "@/lib/identity";
import { Plus, Pencil, Trash2, Check, X, AtSign, Layers } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/artists")({
  head: () => ({ meta: [{ title: "Artist Profiles — Auragram" }] }),
  component: () => (
    <RequireAuth>
      <SettingsArtistsPage />
    </RequireAuth>
  ),
});

function SettingsArtistsPage() {
  const { profile } = useAuth();
  const [list, setList] = useState<ArtistProfile[] | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!profile) return;
    listMyArtistProfiles(profile.id).then(setList).catch(() => setList([]));
  }, [profile]);

  const onAdd = async (a: ArtistProfile) => setList((l) => [...(l ?? []), a]);
  const onUpdate = (id: string, patch: Partial<ArtistProfile>) =>
    setList((l) => (l ?? []).map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const onDelete = (id: string) => setList((l) => (l ?? []).filter((x) => x.id !== id));

  return (
    <div className="min-h-screen flex flex-col">
      <Nav showCta={false} />
      <main className="flex-1 mx-auto w-full max-w-2xl px-5 sm:px-8 py-12 sm:py-16">
        <div className="text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 h-7 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            <Layers className="h-3 w-3" /> Settings
          </div>
          <h1 className="mt-4 font-display text-3xl sm:text-4xl tracking-tight">
            Your <span className="text-aura-gradient">Artist Profiles</span>.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            One account, as many artist identities as you need.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {list === null ? (
            <p className="text-center text-sm text-muted-foreground py-12">…</p>
          ) : list.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">
              No artist profiles yet.
            </p>
          ) : (
            list.map((a) => (
              <ArtistRow key={a.id} a={a} onUpdate={onUpdate} onDelete={onDelete} />
            ))
          )}

          {adding ? (
            <AddArtist
              userId={profile!.id}
              onCancel={() => setAdding(false)}
              onCreated={(a) => { onAdd(a); setAdding(false); }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl glass h-12 text-sm hover:bg-foreground/10 transition-colors"
            >
              <Plus className="h-4 w-4" /> New Artist Profile
            </button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ArtistRow({
  a, onUpdate, onDelete,
}: {
  a: ArtistProfile;
  onUpdate: (id: string, patch: Partial<ArtistProfile>) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(a.artist_name);
  const [handle, setHandle] = useState(a.artist_handle ?? "");
  const [bio, setBio] = useState(a.bio ?? "");

  const save = async () => {
    try {
      await updateArtistProfile(a.id, {
        artist_name: name.trim(),
        artist_handle: handle.trim().toLowerCase() || null,
        bio: bio.trim() || null,
      });
      onUpdate(a.id, { artist_name: name.trim(), artist_handle: handle.trim().toLowerCase() || null, bio: bio.trim() || null });
      setEditing(false);
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    }
  };

  const remove = async () => {
    if (!confirm(`Delete artist profile "${a.artist_name}"? Auras attributed to it will become un-attributed.`)) return;
    try {
      await deleteArtistProfile(a.id);
      onDelete(a.id);
      toast.success("Deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete");
    }
  };

  if (editing) {
    return (
      <div className="rounded-2xl bg-background/40 border border-border/60 p-4 space-y-2">
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-transparent outline-none text-sm" placeholder="Artist name" />
        <div className="flex items-center gap-2">
          <AtSign className="h-3.5 w-3.5 text-muted-foreground" />
          <input value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase())} className="w-full bg-transparent outline-none text-sm" placeholder="handle" />
        </div>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} className="w-full bg-transparent outline-none text-sm resize-none" placeholder="Short bio" />
        <div className="flex gap-2">
          <button onClick={save} className="flex-1 rounded-full h-9 text-xs bg-aura-gradient text-primary-foreground inline-flex items-center justify-center gap-1.5"><Check className="h-3 w-3" /> Save</button>
          <button onClick={() => setEditing(false)} className="rounded-full h-9 px-4 text-xs glass inline-flex items-center gap-1.5"><X className="h-3 w-3" /> Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-background/40 border border-border/60 p-4 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-display text-base truncate">{a.artist_name}</p>
        {a.artist_handle && <p className="text-[11px] text-muted-foreground">@{a.artist_handle}</p>}
        {a.bio && <p className="mt-1 text-[12px] text-muted-foreground line-clamp-2">{a.bio}</p>}
      </div>
      <button onClick={() => setEditing(true)} className="rounded-full p-2 hover:bg-foreground/10 transition-colors" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
      <button onClick={remove} className="rounded-full p-2 hover:bg-foreground/10 transition-colors" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}

function AddArtist({ userId, onCancel, onCreated }: { userId: string; onCancel: () => void; onCreated: (a: ArtistProfile) => void }) {
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const create = async () => {
    if (!name.trim()) return;
    try {
      const a = await createArtistProfile({
        user_id: userId,
        artist_name: name.trim(),
        artist_handle: handle.trim().toLowerCase() || null,
        bio: bio.trim() || null,
      });
      onCreated(a);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create");
    }
  };
  return (
    <div className="rounded-2xl bg-background/40 border border-border/60 p-4 space-y-2">
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-transparent outline-none text-sm" placeholder="Artist name" />
      <div className="flex items-center gap-2">
        <AtSign className="h-3.5 w-3.5 text-muted-foreground" />
        <input value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase())} className="w-full bg-transparent outline-none text-sm" placeholder="handle (optional)" />
      </div>
      <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} className="w-full bg-transparent outline-none text-sm resize-none" placeholder="Short bio (optional)" />
      <div className="flex gap-2">
        <button onClick={create} className="flex-1 rounded-full h-9 text-xs bg-aura-gradient text-primary-foreground">Create</button>
        <button onClick={onCancel} className="rounded-full h-9 px-4 text-xs glass">Cancel</button>
      </div>
    </div>
  );
}
