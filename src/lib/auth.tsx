"use client";

import { createSupabaseClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CustomerProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  default_address: string | null;
  default_lat: number | null;
  default_lng: number | null;
  address_notes: string | null;
  preferred_payment: string | null;
};

type AuthContextValue = {
  user: User | null;
  profile: CustomerProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select(
          "id, full_name, phone, default_address, default_lat, default_lng, address_notes, preferred_payment"
        )
        .eq("id", userId)
        .maybeSingle();
      setProfile((data as CustomerProfile) ?? null);
    },
    [supabase]
  );

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const sessionUser = data.session?.user ?? null;
    setUser(sessionUser);
    if (sessionUser) {
      await loadProfile(sessionUser.id);
    } else {
      setProfile(null);
    }
    setLoading(false);
  }, [supabase, loadProfile]);

  useEffect(() => {
    let active = true;

    const runRefresh = async () => {
      if (!active) return;
      await refresh();
    };

    void runRefresh();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      // Evita doble carga al abrir la app y refrescos de token que bloquean la UI
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") return;
      void runRefresh();
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, refresh]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [supabase]);

  const value = useMemo(
    () => ({ user, profile, loading, refresh, signOut }),
    [user, profile, loading, refresh, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}