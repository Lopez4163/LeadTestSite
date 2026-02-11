import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

export const runtime = "nodejs";


// ===================================================
// 📦 MOCK DATA
// FOR TESTING TO NOT EXHAUST MODEL TOKENS 
// ===================================================
const MOCK_RESPONSE = {
  teaser: "It sounds like your challenge isn’t just getting clients’ attention, but creating moments that actually stick with them. Thoughtful gifting can turn routine interactions into emotional touchpoints that strengthen relationships over time.",
  preview: "When gifting is approached strategically, it becomes more than a nice gesture — it creates memorable moments that clients associate with your brand. The right approach focuses on timing, relevance, and emotional intent, not just the item itself.",
  pdf: {
    problem_reframe: "At the core of your challenge is the difficulty of standing out in a crowded, transactional landscape where most touchpoints feel forgettable. Even strong offerings can fade into the background when interactions lack emotional impact. The real issue isn’t effort — it’s creating moments clients genuinely remember.",
    why_gifting_works: "Strategic gifting works because emotional experiences are remembered far longer than digital messages or standard incentives. When done with intention, gifting signals care, effort, and thoughtfulness in a way few channels can replicate. This creates differentiation at a human level, not just a competitive one.",
    strategy_shape: "Effective gifting strategies are designed around moments that matter, not volume or frequency. They balance timing, emotional intent, and relevance to the recipient so the gesture feels personal rather than promotional. The focus is on perceived meaning and effort, ensuring the experience aligns naturally with the relationship you’re building.",
    success_and_next_step: "When executed well, gifting leads to stronger recall, warmer conversations, and deeper long-term relationships with clients. The exact execution depends on your audience, goals, and context, which is why the final approach is best mapped together. A short conversation is often the fastest way to translate this strategy into a plan that fits your business."
  }
};


// ===================================================
// 📦 VALIDATION SCHEMA
// Matches your FormInfo + UserInfo types from the frontend
// ===================================================
const GenerateBodySchema = z.object({
  formInfo: z.object({
    problemToSolve: z.string().min(1, { message: "problemToSolve is required" }),
  }),
  userInfo: z.object({
    name: z.string().min(1, { message: "name is required" }),
    email: z.email({ message: "email must be valid" }),
  }),
});

// ===================================================
// 🤖 GEMINI PROMPT
// Takes the problem and tells Gemini to answer briefly
// then CTA to contact the team
// ===================================================
function buildPrompt(problem: string): string {
  console.log('THIS IS THE PROBLEM THE PROMPT IS TAKING IN: ')
  return `You are a gifting strategist at Real.AI. A potential customer has shared this challenge:

"${problem}"

Your task: Show how strategic corporate gifting can solve their problem by creating memorable emotional connections with their clients.

Return ONLY valid JSON in this exact format (no markdown, no backticks):
{
  "teaser": "...",
  "preview": "...",
  "pdf": {
    "problem_reframe": "...",
    "why_gifting_works": "...",
    "strategy_shape": "...",
    "success_and_next_step": "..."
  }
}


Rules:
- teaser: 1-2 sentences. Connect their problem to how gifting builds emotional bonds with clients.
- preview: 2-3 sentences. Hint at the gifting strategy without revealing specifics. Mention emotional connection/memorable moments.
- pdf.problem_reframe:
  - 2–3 sentences
  - Rephrase the user's challenge more clearly and insightfully
  - Add one subtle insight they did not explicitly state
  - No solutions yet

- pdf.why_gifting_works:
  - 2–3 sentences
  - Explain why strategic gifting is an effective lever for this type of problem
  - Focus on emotional memory, differentiation, and attention
  - Educational, not salesy

- pdf.strategy_shape:
  - 3–4 sentences
  - Describe the high-level structure of an effective gifting strategy
  - Mention dimensions like timing, intent, and relevance
  - Do NOT mention specific gifts, budgets, timelines, or vendors

- pdf.success_and_next_step:
  - 2–3 sentences
  - Describe what success looks like once the strategy is executed well
  - End with a soft transition to mapping the exact execution together on a call

GLOBAL RULES:
- No bullet points
- No headers
- No lists
- No concrete gift examples
- No pricing, SKUs, or execution details
- Warm, confident, conversational tone
- Output must be valid JSON only`
}

// ===================================================
// 🔧 UTILS (kept from old code)
// ===================================================
function parseGenAiError(err: any) {
  const status =
    err?.status ??
    err?.response?.status ??
    err?.cause?.status ??
    err?.error?.code ??
    undefined;

  const message =
    err?.message ??
    err?.response?.data?.error?.message ??
    err?.error?.message ??
    "Gemini request failed";

  const code =
    err?.error?.status ??
    err?.response?.data?.error?.status ??
    err?.code ??
    undefined;

  const details =
    err?.error ??
    err?.response?.data ??
    err?.cause ??
    undefined;

  const retryAfter =
    err?.response?.headers?.["retry-after"] ??
    err?.headers?.["retry-after"] ??
    undefined;

  return { status: typeof status === "number" ? status : undefined, code, message, retryAfter, details };
}

// ===================================================
// 📤 POST HANDLER
// ===================================================
export async function POST(req: Request) {
  const requestId = crypto.randomUUID();

  try {
    const body = await req.json();

    // Validate the body matches our schema
    const parsedBody = GenerateBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          ok: false,
          code: "BAD_REQUEST",
          error: "Invalid request body",
          issues: parsedBody.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
          requestId,
        },
        { status: 400 }
      );
    }

    const { formInfo, userInfo } = parsedBody.data;

    // PROCESSING MOCK DATA IF IN .ENV IS TRUE
    if (process.env.MOCK_DATA === 'true') {
      const { teaser, preview, pdf } = MOCK_RESPONSE;
      console.log("=== GEMINI OUTPUT ===");
      console.log(" ==== TEASER ====");
      console.log(teaser);
      console.log("==== PREVIEW ====");
      console.log(preview);
      console.log("==== PDF ====");
      console.log(pdf);
      console.log("==== END ====");
      
      return NextResponse.json(
        {
          ok: true,                        // ← FIX: add ok: true
          data: { teaser, preview, pdf }   // ← FIX: wrap in data
        },
        { status: 200 }
      );
    }
    

    // -----------------------------------------------
    // API KEY CHECK
    // -----------------------------------------------
    const apiKey = process.env.NEXT_GEMINI_API_KEY;
    if (!apiKey) {
      console.error(`[generate:${requestId}] Missing NEXT_GEMINI_API_KEY`);
      return NextResponse.json(
        { ok: false, error: "Missing NEXT_GEMINI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    // -----------------------------------------------
    // LOG — who's asking and what
    // -----------------------------------------------
    console.log(`[generate:${requestId}] start`, {
      name: userInfo.name,
      email: userInfo.email,
      problem: formInfo.problemToSolve,
    });

    // -----------------------------------------------
    // GEMINI CALL
    // -----------------------------------------------
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: "v1" },
    });

    const resp = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: buildPrompt(formInfo.problemToSolve) }] }],
      config: { temperature: 0.3, maxOutputTokens: 600 },
    });

    const text = resp.text ?? "";
    if (!text) throw new Error("Empty model response");
    const cleanText = text.replace(/```json\n?|```\n?/g, '').trim();

    let teaser: string;
    let preview: string;
    let pdf: {
      problem_reframe: string,
      why_gifting_works: string,
      strategy_shape: string,
      success_and_next_step: string
    }
    

    try {
      const parsed = JSON.parse(cleanText);
      teaser = parsed.teaser?.trim() || "We've analyzed your problem.";
      preview = parsed.preview?.trim() || "Check your email for details.";
      pdf = {
        problem_reframe: parsed.pdf?.problem_reframe?.trim() || "We're analyzing your challenge from a fresh perspective.",
        why_gifting_works: parsed.pdf?.why_gifting_works?.trim() || "Strategic gifting creates memorable touchpoints that build lasting relationships.",
        strategy_shape: parsed.pdf?.strategy_shape?.trim() || "Your strategy will focus on personalized moments at key interaction points.",
        success_and_next_step: parsed.pdf?.success_and_next_step?.trim() || "When executed well, this creates measurable loyalty gains. Let's map the details together."
      };
    } catch (parseErr) {
      console.error('[generate] JSON parse failed:', cleanText);
      teaser = "We've analyzed your problem and found a solution.";
      preview = "Check your email for the full breakdown and next steps.";
      pdf = {
        problem_reframe: "TBD",
        why_gifting_works: "TBD",
        strategy_shape: "TBD",
        success_and_next_step: "TBD"
      }
    }
    console.log(`[generate:${requestId}] success`);
    console.log("=== GEMINI OUTPUT ===");
    console.log(" ==== TEASER ====")
    console.log(teaser)
    console.log("==== PREVIEW ====")
    console.log(preview)
    console.log("==== PDF ====")
    console.log(pdf)
    console.log("==== END ====")
    
    return NextResponse.json(
      {
        ok: true,
        data: { teaser, preview, pdf },
      },
      { status: 200 }
    );
  } catch (err: any) {
    const info = parseGenAiError(err);

    console.error(`[generate:${requestId}] Gemini error`, {
      status: info.status,
      code: info.code,
      message: info.message,
    });

    if (info.status === 429) {
      return NextResponse.json(
        { ok: false, code: "RATE_LIMIT", error: "Rate limited. Try again shortly.", requestId },
        { status: 429 }
      );
    }

    if (info.status === 400) {
      return NextResponse.json(
        { ok: false, code: "BAD_REQUEST", error: info.message, requestId },
        { status: 400 }
      );
    }

    if (info.status === 401 || info.status === 403) {
      return NextResponse.json(
        { ok: false, code: "AUTH_ERROR", error: "Check your Gemini API key.", requestId },
        { status: info.status }
      );
    }

    return NextResponse.json(
      { ok: false, code: "SERVER_ERROR", error: info.message, requestId },
      { status: 500 }
    );
  }
}