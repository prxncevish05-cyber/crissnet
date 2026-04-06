import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/stores/appStore";
import type { UserRole } from "@/lib/constants";

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const login = useAppStore((s) => s.login);
  const logout = useAppStore((s) => s.logout);
  const user = useAppStore((s) => s.user);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Fetch profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", session.user.id)
            .maybeSingle();

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
        } else if (event === "SIGNED_OUT") {
          logout();
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle();

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
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [login, logout]);

  const signOut = async () => {
    await supabase.auth.signOut();
    logout();
  };

  return { loading, user, signOut };
}
