import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface BookingInfo {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  address: string;
  bin_count: number;
  price: number;
  date: string;
  time_slot: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function sendAdminNotification(booking: BookingInfo) {
  try {
    console.log("Sending admin email...");
    const { error } = await resend.emails.send({
      from: "Ecolavage <onboarding@resend.dev>",
      to: "lhdpro09@gmail.com",
      subject: `Nouvelle réservation - ${booking.client_name} (${booking.bin_count} bac${booking.bin_count > 1 ? "s" : ""}) - ${booking.price}€`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #16a34a; margin: 0 0 16px;">Nouvelle réservation !</h2>

          <div style="background: #f9fafb; border-radius: 12px; padding: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Client</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${booking.client_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">T&eacute;l&eacute;phone</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${booking.client_phone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Email</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${booking.client_email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Adresse</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${booking.address}</td>
              </tr>
              <tr style="border-top: 1px solid #e5e7eb;">
                <td style="padding: 8px 0; color: #6b7280;">Date</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${formatDate(booking.date)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Horaire</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${booking.time_slot}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Bacs</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${booking.bin_count}</td>
              </tr>
              <tr style="border-top: 2px solid #e5e7eb;">
                <td style="padding: 12px 0 0; font-size: 18px; color: #6b7280;">Prix</td>
                <td style="padding: 12px 0 0; font-weight: bold; text-align: right; font-size: 18px; color: #16a34a;">${booking.price} &euro;</td>
              </tr>
            </table>
          </div>
        </div>
      `,
    });
    if (error) {
      console.error("Resend error:", error);
    } else {
      console.log("Admin email sent!");
    }
  } catch (err) {
    console.error("Email admin error:", err);
  }
}
