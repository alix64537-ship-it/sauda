import type * as React from "react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = { display_name: string; phone: string | null; telegram: string | null; city: string | null };

type AuthState = {
  user: User | null;
  profile: Profile | null;
  ready: boolean;
  displayName: string;
  signOut: () => Promise<void>;
};

// Reuse one context object across hot reloads: a re-evaluated module would otherwise create a
// second context that the already-mounted provider does not supply.
const globalKey = "__saudaAuthContext";
const store = globalThis as unknown as Record<string, React.Context<AuthState | null> | undefined>;
const AuthContext = (store[globalKey] ??= createContext<AuthState | null>(null));

/** Per-user caches: refreshed on sign-in, dropped on sign-out. */
const PRIVATE_KEYS = ["favorites", "favorite-listings", "profile", "my-listings", "my-applications", "received-applications"];

const SIGNED_OUT: AuthState = {
  user: null,
  profile: null,
  ready: false,
  displayName: "",
  signOut: async () => {},
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        for (const key of PRIVATE_KEYS) void queryClient.invalidateQueries({ queryKey: [key] });
      }
    });
    void supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, phone, telegram, city")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const signOut = async () => {
    await queryClient.cancelQueries();
    for (const key of PRIVATE_KEYS) queryClient.removeQueries({ queryKey: [key] });
    await supabase.auth.signOut();
  };

  const meta = user?.user_metadata as Record<string, string | undefined> | undefined;
  const displayName =
    profile?.display_name || meta?.["display_name"] || meta?.["full_name"] || meta?.["name"] || user?.email?.split("@")[0] || "";

  return (
    <AuthContext.Provider value={{ user, profile: profile ?? null, ready, displayName, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Render as signed out instead of blanking the page; the provider normally wraps every route.
    if (import.meta.env.DEV) console.warn("useAuth rendered outside AuthProvider");
    return SIGNED_OUT;
  }
  return ctx;
}
