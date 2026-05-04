import { useEffect, useMemo, useState } from "react";
import { Plus, Check } from "lucide-react";
import type { ArtistProfile, VisibilityMode } from "@/lib/identity";
import { createArtistProfile, listMyArtistProfiles } from "@/lib/cloudAura";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Props = {
  value: {
    mode: VisibilityMode;
    artistProfileId: string | null;
  };
  onChange: (next: Props["value"]) => void;
  // Returns the resolved public artist name + handle for the current selection
  // so create flow can persist them.
  onResolve?: (resolved: {
    artistProfile: ArtistProfile | null;
    publicArtistName: string;
    publicHandle: string;
  }) => void;
};

export function IdentitySelector({ value, onChange, onResolve }: Props) {
  const { profile } = useAuth();
  const [artists, setArtists] = useState<ArtistProfile[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHandle, setNewHandle] = useState("");

  useEffect(() => {
    if (!profile) return;
    listMyArtistProfiles(profile.id).then(setArtists).catch(() => setArtists([]));
  }, [profile]);

  // Auto-pick first artist if none selected
  useEffect(() => {
    if (value.mode === "artist" && !value.artistProfileId && artists && artists.length) {
      onChange({ mode: "artist", artistProfileId: artists[0].id });
    }
  }, [artists, value, onChange]);

  const selectedArtist = useMemo(
    () => artists?.find((a) => a.id === value.artistProfileId) ?? null,
    [artists, value.artistProfileId],
  );

  // Resolve identity for parent
  useEffect(() => {
    if (!profile) return;
    let publicArtistName = "";
    let publicHandle = "";
    if (value.mode === "artist" && selectedArtist) {
      publicArtistName = selectedArtist.artist_name;
      publicHandle = selectedArtist.artist_handle ?? "";
    } else if (value.mode === "username") {
      publicArtistName = profile.display_name || profile.username || "";
      publicHandle = profile.username ?? "";
    }
    onResolve?.({ artistProfile: selectedArtist, publicArtistName, publicHandle });
  }, [value.mode, selectedArtist, profile, onResolve]);

  const addArtist = async () => {
    if (!profile || !newName.trim()) return;
    try {
      const a = await createArtistProfile({
        user_id: profile.id,
        artist_name: newName.trim(),
        artist_handle: newHandle.trim().toLowerCase() || null,
      });
      setArtists((prev) => [...(prev ?? []), a]);
      onChange({ mode: "artist", artistProfileId: a.id });
      setCreating(false);
      setNewName(""); setNewHandle("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create artist profile");
    }
  };

  return (
    <div className="glass rounded-3xl p-4 sm:p-5 space-y-3">
      <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/80 px-1">
        Who is this Aura for?
      </p>

      {/* Artist Profile */}
      <button
        type="button"
        onClick={() => onChange({ mode: "artist", artistProfileId: value.artistProfileId ?? artists?.[0]?.id ?? null })}
        className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors border ${value.mode === "artist" ? "border-foreground/30 bg-foreground/5" : "border-border/60 bg-background/40 hover:bg-foreground/5"}`}
      >
        <Dot active={value.mode === "artist"} />
        <div className="flex-1 min-w-0">
          <p className="text-sm">Artist Profile</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {selectedArtist
              ? `${selectedArtist.artist_name}${selectedArtist.artist_handle ? ` · @${selectedArtist.artist_handle}` : ""}`
              : "Choose the artist identity for this Aura."}
          </p>
        </div>
        {value.mode === "artist" && <Check className="h-4 w-4 text-foreground/70" />}
      </button>

      {/* Artist picker */}
      {value.mode === "artist" && (artists?.length ?? 0) > 1 && (
        <div className="flex flex-wrap gap-1.5 pl-2">
          {artists!.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onChange({ mode: "artist", artistProfileId: a.id })}
              className={`rounded-full px-3 h-7 text-[11px] uppercase tracking-[0.2em] ${value.artistProfileId === a.id ? "bg-foreground/10 text-foreground" : "border border-border/60 text-muted-foreground hover:text-foreground"}`}
            >
              {a.artist_name}
            </button>
          ))}
        </div>
      )}

      {/* Add artist */}
      {value.mode === "artist" && (
        creating ? (
          <div className="rounded-2xl bg-background/40 border border-border/60 p-3 space-y-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Artist name"
              className="w-full bg-transparent outline-none text-sm"
            />
            <input
              value={newHandle}
              onChange={(e) => setNewHandle(e.target.value.toLowerCase())}
              placeholder="@handle (optional)"
              className="w-full bg-transparent outline-none text-sm"
              autoCapitalize="none"
              spellCheck={false}
            />
            <div className="flex gap-2">
              <button type="button" onClick={addArtist} className="flex-1 rounded-full h-9 text-xs bg-aura-gradient text-primary-foreground">Create</button>
              <button type="button" onClick={() => setCreating(false)} className="rounded-full h-9 px-4 text-xs glass">Cancel</button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="ml-2 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3 w-3" /> New Artist Profile
          </button>
        )
      )}

      {/* Username */}
      <button
        type="button"
        onClick={() => onChange({ mode: "username", artistProfileId: null })}
        className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors border ${value.mode === "username" ? "border-foreground/30 bg-foreground/5" : "border-border/60 bg-background/40 hover:bg-foreground/5"}`}
      >
        <Dot active={value.mode === "username"} />
        <div className="flex-1 min-w-0">
          <p className="text-sm">Username</p>
          <p className="text-[11px] text-muted-foreground">
            {profile?.username ? `Posted as @${profile.username}` : "Posted under your username"}
          </p>
        </div>
        {value.mode === "username" && <Check className="h-4 w-4 text-foreground/70" />}
      </button>

      {/* Anonymous */}
      <button
        type="button"
        onClick={() => onChange({ mode: "anonymous", artistProfileId: null })}
        className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors border ${value.mode === "anonymous" ? "border-foreground/30 bg-foreground/5" : "border-border/60 bg-background/40 hover:bg-foreground/5"}`}
      >
        <Dot active={value.mode === "anonymous"} />
        <div className="flex-1 min-w-0">
          <p className="text-sm">Post anonymously</p>
          <p className="text-[11px] text-muted-foreground">
            Public AuraLink shows "Anonymous Aura" — still saved privately to your Farm.
          </p>
        </div>
        {value.mode === "anonymous" && <Check className="h-4 w-4 text-foreground/70" />}
      </button>
    </div>
  );
}

function Dot({ active }: { active: boolean }) {
  return (
    <span className={`inline-block h-4 w-4 rounded-full border ${active ? "border-foreground bg-aura-gradient" : "border-border"}`} />
  );
}
