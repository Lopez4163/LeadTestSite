import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

type SolutionEmailData = {
  to: string;
  name: string;
  industry: string;
  problem: string;
  teaser: string;
  preview: string;
  problem_reframe: string;
  why_gifting_works: string;
  strategy_shape: string;
  success_and_next_step: string;
  pdfBuffer: Buffer; // ← add this
};

export async function sendSolutionEmail(data: SolutionEmailData) {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error("SENDGRID_API_KEY is not set");
  }
  const base64Pdf = data.pdfBuffer.toString("base64");

  // Option 1: Use a SendGrid template (recommended)
  if (process.env.SENDGRID_SOLUTION_TEMPLATE_ID) {
    const msg = {
      to: data.to,
      from: "nlopez6499@gmail.com", // Replace with your verified sender
      templateId: process.env.SENDGRID_SOLUTION_TEMPLATE_ID,
      dynamicTemplateData: {
        ...data
      }, 
      attachments: [
        {
          content: base64Pdf,                 
          filename: "real-ai-gifting-strategy.pdf",
          type: "application/pdf",
          disposition: "attachment",
        },
      ],

    };

    await sgMail.send(msg);
    return { success: true };
  }



  // Option 2: Fallback to plain HTML if no template
  const msg = {
    to: data.to,
    from: "adlopez034@gmail.com",
    subject: `Your Gifting Strategy for ${data.industry} 🎁`,
    text: `Hey ${data.name},\n\n${data.teaser}\n\n${data.preview}\n\nThanks,\nReal.AI Team`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hey ${data.name},</h2>
        <p style="font-size: 16px; line-height: 1.6;">${data.teaser}</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 15px; line-height: 1.6; margin: 0;">${data.preview}</p>
        </div>
        <p style="color: #666; font-size: 14px;">
          Problem you shared: <strong>${data.problem}</strong>
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="font-size: 14px; color: #888;">
          Ready to dive deeper? <a href="https://yoursite.com/schedule">Schedule a call</a> with our team.
        </p>
      </div>
    `,
  };

  await sgMail.send(msg);
  return { success: true };
}