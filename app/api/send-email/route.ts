import { NextRequest, NextResponse } from "next/server";
import { sendSolutionEmail } from "@/app/lib/sendGrid/sendEmail";
import { PDFDocument } from "pdf-lib";

import { z } from "zod";

export const runtime = "nodejs";

const EmailBodySchema = z.object({
  userInfo: z.object({
    name: z.string(),
    email: z.string().email(),
    industry: z.string(),
  }),
  formInfo: z.object({
    problemToSolve: z.string(),
  }),
  aiResponse: z.object({
    teaser: z.string(),
    preview: z.string(),
    pdf: z.object({  // ← ADD THIS
      problem_reframe: z.string(),
      why_gifting_works: z.string(),
      strategy_shape: z.string(),
      success_and_next_step: z.string(),
    }),
  }),
});

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const body = await req.json();
    const parsed = EmailBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid request body",
          issues: parsed.error.issues,
          requestId,
        },
        { status: 400 }
      );
    }

    const { userInfo, formInfo, aiResponse } = parsed.data;
    const { problem_reframe, why_gifting_works, strategy_shape, success_and_next_step } = aiResponse.pdf
    console.log(`[send-email:${requestId}] Sending to ${userInfo.email}`);

    // -----------------------------------------------
    // BUILD OG URL
    // -----------------------------------------------
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const ogEndpoint = new URL("/api/og/gifting-strategy", baseUrl);
    console.log('ogEndpoint', ogEndpoint)

    // -----------------------------------------------
    // FETCH OG IMAGE
    // -----------------------------------------------
    const imgRes = await fetch(ogEndpoint.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "image/png",
      },
      cache: "no-store",
      body: JSON.stringify({
        recipientName: userInfo.name,
        industry: userInfo.industry,
        pdf: aiResponse.pdf, // all long text lives here safely
      }),
    });
    
    
    // -----------------------------------------------
    // CONVERT PNG → PDF
    // -----------------------------------------------
    const pngBytes = await imgRes.arrayBuffer();

    const pdfDoc = await PDFDocument.create();
    const png = await pdfDoc.embedPng(pngBytes);
    
    const { width, height } = png.scale(1);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(png, { x: 0, y: 0, width, height });
    
    const pdfBytes = await pdfDoc.save();

    await sendSolutionEmail({
      to: userInfo.email,
      name: userInfo.name,
      industry: userInfo.industry,
      problem: formInfo.problemToSolve,
      teaser: aiResponse.teaser,
      preview: aiResponse.preview,
      problem_reframe: problem_reframe,
      why_gifting_works: why_gifting_works,
      strategy_shape: strategy_shape,
      success_and_next_step: success_and_next_step,
      pdfBuffer: Buffer.from(pdfBytes), 
    });

    console.log(`[send-email:${requestId}] Success`);
    return NextResponse.json({ ok: true }, { status: 200 });

  } catch (err: any) {
    console.error(`[send-email:${requestId}] Error:`, err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to send email", requestId },
      { status: 500 }
    );
  }
}