import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "RESEND_API_KEY manquant" });
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: "Ecolavage <onboarding@resend.dev>",
      to: "lhdpro09@gmail.com",
      subject: "Test Ecolavage - Ca marche !",
      html: "<h2 style='color: green;'>Les emails Ecolavage fonctionnent !</h2>",
    });

    if (error) {
      return Response.json({ error });
    }

    return Response.json({ success: true, id: data?.id });
  } catch (err) {
    return Response.json({ error: String(err) });
  }
}
