"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { getPasswordRules, validateCheckoutFields } from "@/lib/validation";

type Mode = "login" | "register";

export default function AccederPage() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const supabase = createSupabaseClient();

  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) router.replace("/cuenta");
  }, [user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "login") {
        const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signErr) throw signErr;
      } else {
        const rules = validateCheckoutFields({
          fullName,
          phone: "71234567",
          email,
          address: "x",
          password,
          createAccount: true,
        });
        if (rules.password || rules.fullName || rules.email) {
          throw new Error("Revisa nombre, email y contraseña");
        }
        const { error: signErr } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (signErr) throw signErr;
      }
      await refresh();
      router.replace("/cuenta");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al acceder");
      setSubmitting(false);
    }
  }

  const passwordRules = getPasswordRules(password);

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <Link href="/" className="text-xs text-neon-cyan hover:text-white">
          ← Volver a la tienda
        </Link>
        <h1 className="mt-4 font-brand text-3xl text-white">
          ACCEDER <span className="text-neon-cyan">CUENTA</span>
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Gestiona tu perfil, direcciones e historial de pedidos
        </p>

        <div className="mt-6 flex rounded-xl border border-white/10 p-1">
          {(["login", "register"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-lg py-2 text-sm transition ${
                mode === m ? "bg-neon-cyan/15 text-neon-cyan" : "text-zinc-400"
              }`}
            >
              {m === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-glass glass-surface p-6">
          {mode === "register" && (
            <input
              className="checkout-input"
              placeholder="Nombre completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          )}
          <input
            className="checkout-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="checkout-input"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {mode === "register" && (
            <ul className="grid gap-1 text-xs sm:grid-cols-2">
              {(
                [
                  ["minLength", "8+ caracteres"],
                  ["uppercase", "Mayúscula"],
                  ["lowercase", "Minúscula"],
                  ["number", "Número"],
                  ["special", "Signo especial"],
                ] as const
              ).map(([key, label]) => (
                <li key={key} className={passwordRules[key] ? "text-neon-cyan" : "text-zinc-500"}>
                  {passwordRules[key] ? "✓" : "○"} {label}
                </li>
              ))}
            </ul>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" className="btn-neon w-full py-2.5 text-sm" disabled={submitting}>
            {submitting ? "Procesando…" : mode === "login" ? "Ingresar" : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          ¿Solo quieres comprar?{" "}
          <Link href="/checkout" className="text-neon-cyan hover:text-white">
            Checkout como invitado
          </Link>
        </p>
      </section>
    </main>
  );
}