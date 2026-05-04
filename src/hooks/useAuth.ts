import { useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  auth_user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  default_visibility: "artist" | "username" | "choose" | "anonymous";
  allow_anonymous: boolean;
};

let sessionCache: Session | null | undefined = undefined;
let profileCache: Profile | null = null;

export function useAuth() {
  const [session, setSession] = useState<Session | null | undefined>(sessionCache);
  const [profile, setProfile] = useState<Profile | null>(profileCache);
  const [loading, setLoading] = useState(sessionCache === undefined);

  const refreshProfile = useCallback(async (user: User | null | undefined) => {
    if (!user) {
      profileCache = null;
      setProfile(null);
      return null;
    }
    const { data } = await supabase
      .from("profiles")
      .select("id, auth_user_id, username, display_name, avatar_url, default_visibility, allow_anonymous")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    profileCache = (data as Profile) ?? null;
    setProfile(profileCache);
    return profileCache;
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      sessionCache = sess;
      setSession(sess);
      // Defer profile fetch to avoid auth deadlocks
      setTimeout(() => { refreshProfile(sess?.user ?? null); }, 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      sessionCache = data.session;
      setSession(data.session);
      setLoading(false);
      refreshProfile(data.session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [refreshProfile]);

  return {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    refreshProfile: () => refreshProfile(session?.user ?? null),
    signOut: async () => {
      await supabase.auth.signOut();
      profileCache = null;
    },
  };
}
