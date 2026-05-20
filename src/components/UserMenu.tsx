import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Sparkles, User as UserIcon, Layers, Pencil } from "lucide-react";
import { EditProfileDialog } from "./EditProfileDialog";

export function UserMenu() {
  const { user, profile, loading, signOut } = useAuth();
  const nav = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  if (loading) return <div className="h-9 w-9" aria-hidden />;

  if (!user) {
    return (
      <Link
        to="/auth"
        search={{ mode: "signin" }}
        className="text-xs sm:text-sm tracking-wide text-muted-foreground hover:text-foreground transition-colors px-2"
      >
        Sign in
      </Link>
    );
  }

  const label = profile?.username ? `@${profile.username}` : profile?.display_name || user.email;
  const initial = (profile?.username || profile?.display_name || user.email || "A").slice(0, 1).toUpperCase();
  const avatar = profile?.avatar_url ?? null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Account menu"
            className="relative grid place-items-center h-9 w-9 rounded-full overflow-hidden bg-aura-gradient text-primary-foreground text-xs font-medium shadow-[0_0_20px_-8px_oklch(0.7_0.2_310/0.7)] ring-1 ring-foreground/10"
          >
            {avatar ? (
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="truncate">{label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" /> Edit profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => nav({ to: "/farm" })}>
            <Sparkles className="h-4 w-4 mr-2" /> My Auras
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => nav({ to: "/settings/artists" })}>
            <Layers className="h-4 w-4 mr-2" /> Artist Profiles
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => nav({ to: "/settings/artists" })}>
            <UserIcon className="h-4 w-4 mr-2" /> Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={async () => {
              await signOut();
              nav({ to: "/" });
            }}
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}
