import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return Response.json({
      error: "GMAIL_USER ou GMAIL_APP_PASSWORD manquant",
      hasUser: !!user,
      hasPass: !!pass,
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    // Vérifie la connexion SMTP
    await transporter.verify();

    // Envoie un email test
    const info = await transporter.sendMail({
      from: `"Ecolavage" <${user}>`,
      to: user,
      subject: "Test Ecolavage - Email fonctionne !",
      html: "<h2>Les emails Ecolavage fonctionnent !</h2><p>Ce mail est un test.</p>",
    });

    return Response.json({
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
    });
  } catch (err) {
    return Response.json({
      error: String(err),
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
