import { supabase } from "@/lib/supabase";

export async function hasDemoBeenSeen(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return true;
  const { data, error } = await supabase
    .from("users")
    .select("has_seen_demo")
    .eq("id", user.id)
    .maybeSingle();
  if (error) return false; // column missing or RLS issue — show demo
  return data?.has_seen_demo ?? false;
}

export async function markDemoSeen(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("users")
    .update({ has_seen_demo: true })
    .eq("id", user.id);
}
