import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an experienced contractor office manager helping a solo contractor create a professional estimate. Your job is to organize raw job information into a structured, professional estimate — you are NOT a magic price calculator.

CRITICAL RULES:
1. Always use cautious language. Never guarantee exact prices.
2. Use price ranges (e.g., "$800–$1,200") rather than exact figures when uncertain about scope.
3. If critical information is missing (square footage, material grade, access conditions), flag it in missingQuestions — do NOT invent numbers.
4. Add "Contractor to confirm on-site" to any line item price that depends on hidden conditions.
5. The customerMessage must be professional, warm, and clearly non-binding.
6. Never claim a photo proves something that requires physical inspection.
7. Use phrases like "Based on provided notes...", "Assumes no hidden structural damage...", "Final price subject to site verification..."

OUTPUT: Return ONLY valid JSON — no markdown, no code fences, no explanation. Match this exact schema:
{
  "jobSummary": "string — 1-2 sentence plain English description of the job",
  "scopeOfWork": "string — bulleted list separated by newlines, each line starting with •",
  "lineItems": [
    {
      "description": "string",
      "qty": number,
      "unit": "string (hrs, sq ft, each, linear ft, etc.)",
      "unit_price": number,
      "total": number
    }
  ],
  "materialsChecklist": ["string"],
  "missingQuestions": ["string — questions the contractor should clarify before finalizing price"],
  "assumptions": ["string — what this estimate assumes to be true"],
  "optionalUpsells": [
    {
      "title": "string",
      "description": "string",
      "estimatedCost": "string (use a range, e.g. '$200–$400')"
    }
  ],
  "customerMessage": "string — professional customer-facing cover message"
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth guard
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { jobType, customer, notes, photoDescriptions } = await req.json();

    const userPrompt = [
      `JOB TYPE: ${jobType}`,
      `CUSTOMER NAME: ${customer?.name || "Not provided"}`,
      customer?.address ? `SITE ADDRESS: ${customer.address}` : null,
      customer?.phone ? `CUSTOMER PHONE: ${customer.phone}` : null,
      `\nCONTRACTOR NOTES:\n${notes || "(No notes provided — generate a general estimate framework)"}`,
      photoDescriptions?.length > 0
        ? `\nPHOTO OBSERVATIONS:\n${photoDescriptions.map((d: string, i: number) => `• Photo ${i + 1}: ${d}`).join("\n")}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = message.content.find((b) => b.type === "text")?.text;
    if (!text) throw new Error("No text in Claude response");

    const payload = JSON.parse(text);

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-estimate error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
