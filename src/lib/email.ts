import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = "TodoPlástico <soporte@todo-plastico.com>";
const ADMIN_EMAILS = (process.env.TODO_PLASTICO_ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean);

export async function sendTicketCreatedToAdmin(opts: {
  ticketCode: string;
  subject: string;
  category: string;
  userEmail: string;
}) {
  if (!resend || !ADMIN_EMAILS.length) return;
  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAILS,
    subject: `[Soporte] Nuevo ticket ${opts.ticketCode}: ${opts.subject}`,
    html: `
      <p>Se ha abierto un nuevo ticket de soporte en TodoPlástico.</p>
      <table style="margin-top:12px;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:4px 12px 4px 0;color:#64748b">Ticket</td><td><strong>${opts.ticketCode}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#64748b">Empresa</td><td>${opts.userEmail}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#64748b">Categoría</td><td>${opts.category}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#64748b">Asunto</td><td>${opts.subject}</td></tr>
      </table>
      <p style="margin-top:16px"><a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://todo-plastico.com"}/admin#tickets" style="background:#1e3a5f;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">Ver ticket en el panel admin</a></p>
    `,
  });
}

export async function sendTicketReplyToUser(opts: {
  ticketCode: string;
  subject: string;
  message: string;
  userEmail: string;
}) {
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: opts.userEmail,
    subject: `Re: [${opts.ticketCode}] ${opts.subject}`,
    html: `
      <p>El equipo de TodoPlástico ha respondido a tu ticket <strong>${opts.ticketCode}</strong>.</p>
      <blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #e2e8f0;color:#475569;font-size:14px">${opts.message.replace(/\n/g, "<br>")}</blockquote>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://todo-plastico.com"}/panel#soporte" style="background:#1e3a5f;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">Ver hilo completo</a></p>
      <p style="margin-top:24px;font-size:12px;color:#94a3b8">TodoPlástico · Directorio B2B de la industria plástica en México</p>
    `,
  });
}

export async function sendTicketReplyToAdmin(opts: {
  ticketCode: string;
  subject: string;
  message: string;
  userEmail: string;
}) {
  if (!resend || !ADMIN_EMAILS.length) return;
  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAILS,
    subject: `[Soporte] Respuesta en ${opts.ticketCode}: ${opts.subject}`,
    html: `
      <p><strong>${opts.userEmail}</strong> ha respondido en el ticket ${opts.ticketCode}.</p>
      <blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #e2e8f0;color:#475569;font-size:14px">${opts.message.replace(/\n/g, "<br>")}</blockquote>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://todo-plastico.com"}/admin#tickets" style="background:#1e3a5f;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">Responder en el panel admin</a></p>
    `,
  });
}
