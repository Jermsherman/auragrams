import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Sparkles, User as UserIcon, Layers } from "lucide-react";

export function UserMenu() {
  const { user, profile, loading, signOut } = useAuth();
  const nav = useNavigate();

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Account menu"
          className="grid place-items-center h-9 w-9 rounded-full bg-aura-gradient text-primary-foreground text-xs font-medium shadow-[0_0_20px_-8px_oklch(0.7_0.2_310/0.7)]"
        >
          {initial}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
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
  );
}
