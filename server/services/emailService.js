const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[WARN] RESEND_API_KEY is missing. Skipping email sending.");
    return { success: false, message: "API Key missing" };
  }

  try {
    const response = await resend.emails.send({
      from: "onboarding@resend.dev", // default working sender
      to,
      subject,
      html,
    });

    console.log(`[Email] Sent successfully to ${to}. Response ID: ${response.data?.id}`);
    return response;
  } catch (error) {
    console.error("Resend Email Error:", error);
    // Do not throw to avoid crashing the server
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
