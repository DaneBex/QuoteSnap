import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5-20251001": { input: 0.80, output: 4.00 },
  "claude-sonnet-4-6": { input: 3.00, output: 15.00 },
};

const MODEL = Deno.env.get("AI_ESTIMATE_MODEL") ?? "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `You are a contractor admin assistant. Convert raw job notes into a structured estimate draft. Return ONLY valid JSON — no markdown, no code fences, no explanation.

FIELD ROLES:
- Customer-facing (confident, professional language): jobSummary, scopeOfWork, lineItems, customerMessage
- Internal only (cautious language, never shown to customer): missingQuestions, assumptions, optionalUpsells, materialsChecklist

RULES:
1. Never invent qty, unit_price, or total without measurements — use 0 and describe the gap, or omit and flag in missingQuestions.
2. When scope is clear but price depends on unknown qty: set qty:1, unit:"allowance", unit_price:0, total:0 with a cost range in the description.
3. Do NOT generate $0 line items with no useful description — omit them and add to missingQuestions instead.
4. customerMessage: professional, warm, clearly non-binding. Max 2 sentences. Use "thank you for the opportunity" framing — never assume the customer has chosen you (avoid "thank you for choosing us").
5. If CURRENT ESTIMATE LINE ITEMS are provided, treat them as the contractor's manual edits. Preserve every line item where unit_price > 0 exactly as-is — do not alter its description, qty, unit, unit_price, or total unless the clarifying answers explicitly change that item's scope. Only update or fill in line items with unit_price = 0 using new information from the answers. Add new line items only for scope revealed by the answers that isn't already covered.

ESTIMATE QUALITY — set estimateQuality based on pricability:
- "ready": enough detail (measurements, scope, material grade) for a credible priced estimate
- "needs_detail": total would be $0, 3+ blocking questions, or no notes beyond job type

OUTPUT SIZE LIMITS: jobSummary ≤ 2 sentences | scopeOfWork ≤ 5 bullets (• prefix) | lineItems ≤ 6 | materialsChecklist ≤ 5 | missingQuestions ≤ 6 | assumptions ≤ 3 | customerMessage ≤ 2 sentences

OUTPUT: Return ONLY valid JSON matching this exact schema:
{
  "estimateQuality": "ready" | "needs_detail",
  "jobSummary": "string",
  "scopeOfWork": "string — bullets separated by newlines, each starting with •",
  "lineItems": [
    { "description": "string", "qty": number, "unit": "string", "unit_price": number, "total": number }
  ],
  "materialsChecklist": ["string"],
  "missingQuestions": ["string"],
  "assumptions": ["string"],
  "optionalUpsells": [
    { "title": "string", "description": "string", "estimatedCost": "string e.g. '$200–$400'" }
  ],
  "customerMessage": "string"
}`;

const UPDATE_MODE_ADDENDUM = `
REVISION MODE — ACTIVE WHEN CLARIFYING ANSWERS ARE PROVIDED:

You are REVISING an existing estimate, not starting over. These rules override general defaults:

R1. INCORPORATE ANSWERS EVERYWHERE — apply new information to jobSummary, scopeOfWork, lineItem descriptions, materialsChecklist, assumptions, and customerMessage. Specific measurements, material grades, or scope details revealed by answers must appear in the relevant fields.

R2. DO NOT RE-ASK ANSWERED QUESTIONS — do not include any question from ORIGINAL QUESTIONS BEING ANSWERED or PREVIOUSLY ANSWERED QUESTIONS in missingQuestions, even phrased differently. This is a hard rule.

R3. SHRINK missingQuestions — return fewer questions than before answers were provided. Hard cap: 3 questions maximum. If answers resolved all blockers, return an empty array.

R4. REVISE customerMessage with specifics — reference specific details from the answers (material type, measurements, finish, etc.) rather than generic language. Do not ask for information that was already answered.

R5. UPGRADE estimateQuality — if answers resolved major unknowns (measurements, material grade, scope boundaries), set estimateQuality to "ready".

R6. REVISE, DO NOT REPLACE — treat CURRENT JOB SUMMARY and CURRENT SCOPE OF WORK as the working draft. Update only the parts that the answers change; preserve accurate framing.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();
  let inputTokens = 0;
  let outputTokens = 0;
  let promptChars = 0;
  let outputChars = 0;
  let photosIncluded = false;

  try {
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

    const { jobType, customer, notes, photoDescriptions, clarifyingAnswers, previousAnswers, currentEstimate } = await req.json();

    photosIncluded = Array.isArray(photoDescriptions) && photoDescriptions.length > 0;
    const hasAnswers = Array.isArray(clarifyingAnswers) && clarifyingAnswers.length > 0;
    const hasCurrentEstimate = currentEstimate && Array.isArray(currentEstimate.lineItems) && currentEstimate.lineItems.length > 0;

    const userPrompt = [
      `JOB TYPE: ${jobType}`,
      `CUSTOMER NAME: ${customer?.name || "Not provided"}`,
      customer?.address ? `SITE ADDRESS: ${customer.address}` : null,
      customer?.phone ? `CUSTOMER PHONE: ${customer.phone}` : null,
      `\nCONTRACTOR NOTES:\n${notes || "(No notes provided)"}`,
      photosIncluded
        ? `\nPHOTO OBSERVATIONS:\n${(photoDescriptions as string[]).map((d, i) => `• Photo ${i + 1}: ${d}`).join("\n")}`
        : null,
      currentEstimate?.jobSummary
        ? `\nCURRENT JOB SUMMARY (revise from this, do not replace wholesale):\n${currentEstimate.jobSummary}`
        : null,
      currentEstimate?.scopeOfWork
        ? `\nCURRENT SCOPE OF WORK (revise from this, do not replace wholesale):\n${currentEstimate.scopeOfWork}`
        : null,
      hasCurrentEstimate
        ? `\nCURRENT ESTIMATE LINE ITEMS (contractor's manual edits — preserve items with unit_price > 0):\n${JSON.stringify(currentEstimate.lineItems)}`
        : null,
      hasAnswers
        ? (() => {
            const originalQuestions: string[] = currentEstimate?.missingQuestions ?? [];
            const answerMap = new Map(
              (clarifyingAnswers as { question: string; answer: string }[]).map((a) => [a.question, a.answer])
            );
            if (originalQuestions.length > 0) {
              const lines = originalQuestions
                .map((q, i) => {
                  const a = answerMap.get(q) ?? "(no answer — question still open)";
                  return `Q${i + 1}: ${q}\nA${i + 1}: ${a}`;
                })
                .join("\n\n");
              return `\nORIGINAL QUESTIONS BEING ANSWERED:\n${lines}`;
            }
            const lines = (clarifyingAnswers as { question: string; answer: string }[])
              .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
              .join("\n\n");
            return `\nCLARIFYING ANSWERS FROM CONTRACTOR:\n${lines}`;
          })()
        : null,
      Array.isArray(previousAnswers) && previousAnswers.length > 0
        ? `\nPREVIOUSLY ANSWERED QUESTIONS (do not re-ask any of these):\n${(previousAnswers as { question: string; answer: string }[]).map((a) => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n")}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const systemPrompt = hasAnswers ? SYSTEM_PROMPT + "\n\n" + UPDATE_MODE_ADDENDUM : SYSTEM_PROMPT;
    promptChars = systemPrompt.length + userPrompt.length;

    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    inputTokens = message.usage.input_tokens;
    outputTokens = message.usage.output_tokens;

    const text = message.content.find((b) => b.type === "text")?.text;
    if (!text) throw new Error("No text in Claude response");

    outputChars = text.length;

    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
    const payload = JSON.parse(cleaned);

    const pricing = MODEL_PRICING[MODEL] ?? { input: 0, output: 0 };
    const estimatedCost = (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;

    console.log(
      `[generate-estimate] model=${MODEL} latency_ms=${Date.now() - startTime} ` +
      `input_tokens=${inputTokens} output_tokens=${outputTokens} total_tokens=${inputTokens + outputTokens} ` +
      `estimated_cost_usd=${estimatedCost.toFixed(6)} photos_included=${photosIncluded} ` +
      `prompt_chars=${promptChars} output_chars=${outputChars} success=true`
    );

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.log(
      `[generate-estimate] model=${MODEL} latency_ms=${Date.now() - startTime} ` +
      `input_tokens=${inputTokens} output_tokens=${outputTokens} ` +
      `photos_included=${photosIncluded} prompt_chars=${promptChars} ` +
      `success=false error=${err instanceof Error ? err.message : String(err)}`
    );
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
