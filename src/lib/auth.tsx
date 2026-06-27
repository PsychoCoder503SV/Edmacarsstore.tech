"use client";

import { createSupabaseClient } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

  const profileFetchRef = useRef<Promise<void> | null>(null);
  const lastProfileUserId = useRef<string | null>(null);

  const loadProfile = useCallback(
    (userId: string) => {
      if (lastProfileUserId.current === userId && profileFetchRef.current) {
        return profileFetchRef.current;
      }

      lastProfileUserId.current = userId;
      const task = (async () => {
        const { data } = await supabase
          .from("profiles")
          .select(
            "id, full_name, phone, default_address, default_lat, default_lng, address_notes, preferred_payment"
          )
          .eq("id", userId)
          .maybeSingle();
        setProfile((data as CustomerProfile) ?? null);
      })().finally(() => {
        if (profileFetchRef.current === task) {
          profileFetchRef.current = null;
        }
      });

      profileFetchRef.current = task;
      return task;
    },
    [supabase]
  );

  const applySession = useCallback(
    (session: Session | null, opts?: { reloadProfile?: boolean }) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        if (opts?.reloadProfile !== false) {
          void loadProfile(sessionUser.id);
        }
      } else {
        lastProfileUserId.current = null;
        setProfile(null);
      }

      setLoading(false);
    },
    [loadProfile]
  );

  const refreshInFlight = useRef<Promise<void> | null>(null);

  const refresh = useCallback(async () => {
    if (refreshInFlight.current) {
      return refreshInFlight.current;
    }

    const task = (async () => {
      const { data } = await supabase.auth.getSession();
      applySession(data.session);
    })().finally(() => {
      if (refreshInFlight.current === task) {
        refreshInFlight.current = null;
      }
    });

    refreshInFlight.current = task;
    return task;
  }, [supabase, applySession]);

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "TOKEN_REFRESHED") {
        setUser(session?.user ?? null);
        setLoading(false);
        return;
      }

      applySession(session);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, applySession]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    lastProfileUserId.current = null;
    setUser(null);
    setProfile(null);
    setLoading(false);
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