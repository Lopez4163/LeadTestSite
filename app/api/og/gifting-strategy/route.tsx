import RealAiGiftingStrategy from '@/app/components/PdfTemplate/RealAiGiftingStrategyInfographic';
import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    const { recipientName, industry, pdf } = await req.json();

  try {
    const { searchParams } = req.nextUrl;


    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    return new ImageResponse(
      (
        <RealAiGiftingStrategy
            recipientName={recipientName}
            industry={industry}
            problem_reframe={pdf.problem_reframe}
            why_gifting_works={pdf.why_gifting_works}
            strategy_shape={pdf.strategy_shape}
            success_and_next_step={pdf.success_and_next_step}
            assetBaseUrl={pdf.assetBaseUrls}
        />
      ),
      {
        width: 1200,
        height: 1600,
      }
    );
  } catch (error) {
    console.error('OG generation error:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}