import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

function createTransport() {
  const host = import.meta.env.SMTP_HOST;
  const port = Number(import.meta.env.SMTP_PORT || 587);
  const user = import.meta.env.SMTP_USER;
  const pass = import.meta.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP env vars missing');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, email, subject, message } = await request.json();
    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
    }

    const to = import.meta.env.CONTACT_EMAIL || 'eyal20202@gmail.com';
    if (!import.meta.env.SMTP_HOST || !import.meta.env.SMTP_USER || !import.meta.env.SMTP_PASS) {
      // Development fallback: log only
      console.log('[contact:dev]', { to, name, email, subject, message });
      return new Response(JSON.stringify({ ok: true, development: true }), { status: 200 });
    }

    const transporter = createTransport();
    await transporter.sendMail({
      from: `Website Contact <${import.meta.env.SMTP_FROM || import.meta.env.SMTP_USER}>`,
      to,
      subject: `[Site Contact] ${subject}`,
      replyTo: email,
      text: `From: ${name} <${email}>
Subject: ${subject}

${message}`,
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to send message' }), { status: 500 });
  }
};


