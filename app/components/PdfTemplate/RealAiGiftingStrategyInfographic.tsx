import { ImageResponse } from "@vercel/og";

interface GiftingStrategyProps {
  recipientName: string;
  industry: string;
  problem_reframe: string;
  why_gifting_works: string;
  strategy_shape: string;
  success_and_next_step: string;
  assetBaseUrl: string;
}

export default function RealAiGiftingStrategy({
  recipientName, 
  industry,
  problem_reframe,
  why_gifting_works,
  strategy_shape,
  success_and_next_step,
  assetBaseUrl
}: GiftingStrategyProps) {
  const colors = {
    bg: "#0d1116",
    accent: "#3b82f6",
    lightGray: "#9ca3af",
    white: "#f9fafb",
  };


  console.log('OG IMAGE VALIES', problem_reframe, why_gifting_works, strategy_shape, success_and_next_step)
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: colors.bg,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        padding: "60px",
        position: "relative",
      }}
    >
      {/* --- HEADER --- */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginBottom: "40px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: colors.accent,
            }}
          />
          <span
            style={{
              fontSize: "16px",
              color: colors.lightGray,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              fontWeight: 700,
            }}
          >
            Real.AI Gifting Strategy
          </span>
        </div>

        <h1
          style={{
            fontSize: "48px",
            margin: 0,
            fontWeight: 900,
            color: colors.white,
            lineHeight: 1.1,
          }}
        >
          {recipientName}'s Personalized Strategy
        </h1>
        <span
          style={{
            fontSize: "20px",
            color: colors.lightGray,
            marginTop: "8px",
          }}
        >
          Industry: {industry}
        </span>
      </div>

      {/* --- CONTENT SECTIONS --- */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "32px",
          flexGrow: 1,
        }}
      >
        {/* Section 1: Problem Reframe */}
        <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
          {/* <img
            src={`${assetBaseUrl}/assets/problem-reframe.png`}
            width={80}
            height={80}
            style={{ width: "80px", height: "80px", objectFit: "contain", flexShrink: 0 }}
          /> */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
            <div
              style={{
                fontSize: "14px",
                color: colors.accent,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: 700,
              }}
            >
              01 • Your Challenge
            </div>
            <p
              style={{
                fontSize: "18px",
                lineHeight: 1.6,
                color: colors.white,
                margin: 0,
              }}
            >
              {problem_reframe}
            </p>
          </div>
        </div>

        {/* Section 2: Why Gifting Works */}
        <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
          {/* <img
            src={`${assetBaseUrl}/assets/why-gifting.png`}
            width={80}
            height={80}
            style={{ width: "80px", height: "80px", objectFit: "contain", flexShrink: 0 }}
          /> */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
            <div
              style={{
                fontSize: "14px",
                color: colors.accent,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: 700,
              }}
            >
              02 • Why Gifting Works
            </div>
            <p
              style={{
                fontSize: "18px",
                lineHeight: 1.6,
                color: colors.white,
                margin: 0,
              }}
            >
              {why_gifting_works}
            </p>
          </div>
        </div>

        {/* Section 3: Strategy Shape */}
        <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
          {/* <img
            src={`${assetBaseUrl}/assets/strategy-shape.png`}
            width={80}
            height={80}
            style={{ width: "80px", height: "80px", objectFit: "contain", flexShrink: 0 }}
          /> */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
            <div
              style={{
                fontSize: "14px",
                color: colors.accent,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: 700,
              }}
            >
              03 • Your Strategy Structure
            </div>
            <p
              style={{
                fontSize: "18px",
                lineHeight: 1.6,
                color: colors.white,
                margin: 0,
              }}
            >
              {strategy_shape}
            </p>
          </div>
        </div>

        {/* Section 4: Success + Next Step */}
        <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
          {/* <img
            src={`${assetBaseUrl}/assets/success-next-step.png`}
            width={80}
            height={80}
            style={{ width: "80px", height: "80px", objectFit: "contain", flexShrink: 0 }}
          /> */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
            <div
              style={{
                fontSize: "14px",
                color: colors.accent,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: 700,
              }}
            >
              04 • What Success Looks Like
            </div>
            <p
              style={{
                fontSize: "18px",
                lineHeight: 1.6,
                color: colors.white,
                margin: 0,
              }}
            >
              {success_and_next_step}
            </p>
          </div>
        </div>
      </div>

      {/* --- FOOTER CTA --- */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px",
          marginTop: "40px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: "22px",
            fontWeight: 600,
            color: colors.white,
            maxWidth: "700px",
          }}
        >
          Ready to turn this into reality? Let's design your custom gifting campaign together.
        </span>

        <div
          style={{
            backgroundColor: colors.accent,
            color: colors.white,
            padding: "18px 60px",
            borderRadius: "12px",
            fontSize: "20px",
            fontWeight: 700,
            letterSpacing: "0.02em",
          }}
        >
          Schedule Your Call
        </div>
      </div>

      {/* --- FOOTER BAR --- */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "40px",
          paddingTop: "20px",
          borderTop: `1px solid ${colors.lightGray}30`,
        }}
      >
        <span style={{ fontSize: "18px", fontWeight: 700, color: colors.white }}>
          Real.AI
        </span>
        <span style={{ fontSize: "14px", color: colors.lightGray }}>
          © 2025 Real.AI • Making gifting meaningful
        </span>
      </div>
    </div>
  );
}