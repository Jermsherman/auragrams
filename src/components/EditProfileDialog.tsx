// Lightweight dialog for updating display name + avatar. Uses the existing
// `auralink-images` public bucket (per-user folder) for avatar storage.

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { uploadAuraLinkCover } from "@/lib/auralinkImages";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
};

export function EditProfileDialog({ open, onOpenChange }: Props) {
  const { profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !profile) return;
    setDisplayName(profile.display_name ?? "");
    setAvatarUrl(profile.avatar_url ?? "");
  }, [open, profile]);

  const onPickFile = async (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Pick an image file.");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadAuraLinkCover(file);
      setAvatarUrl(url);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          avatar_url: avatarUrl || null,
        })
        .eq("id", profile.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Profile updated");
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  const initial = (profile?.username || profile?.display_name || "A")
    .slice(0, 1)
    .toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/90 backdrop-blur-2xl border-border/60 max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Edit profile</DialogTitle>
          <DialogDescription>
            Your photo appears on your AuraLink and across Auragram.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 rounded-full overflow-hidden bg-aura-gradient grid place-items-center text-2xl font-medium text-primary-foreground ring-1 ring-foreground/15">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initial
              )}
              {uploading && (
                <div className="absolute inset-0 grid place-items-center bg-background/60">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <label className="inline-flex items-center gap-2 cursor-pointer rounded-full glass px-3 h-9 text-xs hover:bg-foreground/10 transition-colors">
                <Upload className="h-3.5 w-3.5" />
                {avatarUrl ? "Replace photo" : "Upload photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl("")}
                  className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" /> Remove
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="display-name" className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              Display name
            </Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={64}
              placeholder="What people call you"
            />
          </div>

          {profile?.username && (
            <p className="text-[11px] text-muted-foreground">
              Username: <span className="text-foreground">@{profile.username}</span>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || uploading}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
