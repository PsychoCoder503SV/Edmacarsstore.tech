import type { User } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export async function findUserByEmail(email: string): Promise<User | null> {
  const supabase = createSupabaseAdmin();
  const normalized = email.trim().toLowerCase();

  for (let page = 1; page <= 5; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    const user = data.users.find((u) => u.email?.toLowerCase() === normalized);
    if (user) return user;
    if (data.users.length < 200) break;
  }

  return null;
}