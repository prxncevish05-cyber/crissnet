import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/stores/appStore";
import type { UserRole } from "@/lib/constants";

function loadProfile(userId: string, login: (u: any) => void) {
  supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()
    .then(({ data: profile }) => {
      if (profile) {
        const av = profile.name
          .split(" ")
          .filter(Boolean)
          .map((w: string) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "??";
        login({
          role: profile.role as UserRole,
          name: profile.name,
          phone: profile.phone,
          avatar: av,
        });
      }
    })
    .catch((err) => console.error("Profile fetch error:", err));
}

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const login = useAppStore((s) => s.login);
  const logout = useAppStore((s) => s.logout);
  const user = useAppStore((s) => s.user);

  useEffect(() => {
    // 1. Restore session from storage first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id, login);
      }
      setLoading(false);
    }).then(undefined, () => {
      setLoading(false);
    });

    // 2. Listen for future auth changes (no await inside!)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          loadProfile(session.user.id, login);
        } else if (event === "SIGNED_OUT") {
          logout();
        }
      }
    );

    // 3. Safety timeout — never stay loading forever
    const timeout = setTimeout(() => setLoading(false), 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [login, logout]);

  const signOut = async () => {
    await supabase.auth.signOut();
    logout();
  };

  return { loading, user, signOut };
}
