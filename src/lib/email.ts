import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "lvzxrpro@yahoo.com";

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

export async function sendClientConfirmation(booking: BookingInfo) {
  try {
    await transporter.sendMail({
      from: `"Ecolavage" <${process.env.GMAIL_USER}>`,
      to: booking.client_email,
      subject: `Ecolavage - Confirmation de votre réservation`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #16a34a; margin: 0;">Ecolavage</h1>
            <p style="color: #6b7280; margin: 4px 0 0;">Des poubelles propres, sans effort</p>
          </div>

          <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 4px; color: #15803d;">Réservation confirmée !</h2>
            <p style="color: #6b7280; margin: 0;">Merci ${booking.client_name}, votre rendez-vous est bien enregistré.</p>
          </div>

          <div style="background: #f9fafb; border-radius: 12px; padding: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Date</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${formatDate(booking.date)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Horaire</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${booking.time_slot}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Nombre de bacs</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${booking.bin_count}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Adresse</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${booking.address}</td>
              </tr>
              <tr style="border-top: 2px solid #e5e7eb;">
                <td style="padding: 12px 0 0; color: #6b7280; font-size: 18px;">Total</td>
                <td style="padding: 12px 0 0; font-weight: bold; text-align: right; font-size: 18px; color: #16a34a;">${booking.price} &euro;</td>
              </tr>
            </table>
          </div>

          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
            Ecolavage - Nettoyage de poubelles &agrave; domicile
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Email client error:", err);
  }
}

export async function sendAdminNotification(booking: BookingInfo) {
  try {
    await transporter.sendMail({
      from: `"Ecolavage" <${process.env.GMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: `Nouvelle réservation - ${booking.client_name} (${booking.bin_count} bac${booking.bin_count > 1 ? "s" : ""})`,
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
                <td style="padding: 8px 0; color: #6b7280;">Téléphone</td>
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
  } catch (err) {
    console.error("Email admin error:", err);
  }
}
