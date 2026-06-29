import { supabase } from "@/lib/supabase";

const SESSION_KEY = "qs_session_id";

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export async function trackPageView(): Promise<void> {
  try {
    await supabase.from("page_views").insert({
      session_id: getSessionId(),
      event_type: "view",
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    });
  } catch {}
}

export async function trackCtaClick(label: string): Promise<void> {
  try {
    await supabase.from("page_views").insert({
      session_id: getSessionId(),
      event_type: "cta_click",
      cta_label: label,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    });
  } catch {}
}
