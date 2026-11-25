import { NextResponse } from 'next/server';

/**
 * Receives purchase requests, project/partnership enquiries, questions and
 * showroom appointment requests.
 *
 * Delivery: if RESEND_API_KEY and ENQUIRY_TO are set, the request is emailed
 * to the VBamboo team (reply-to = the customer). Otherwise it is written to the
 * server log, which is enough for preview testing.
 */
const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .slice(0, 4000);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  // Honeypot: bots fill hidden fields. Pretend success.
  if (body.website) return NextResponse.json({ ok: true });

  const type = String(body.type ?? 'general');
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim();
  if (!name || !EMAIL.test(email)) return NextResponse.json({ ok: false, error: 'invalid' }, { status: 422 });

  const product = body.product as { name?: string; slug?: string } | null;
  const subject =
    type === 'purchase'
      ? `Purchase request · ${product?.name ?? ''}`
      : type === 'appointment'
        ? `Showroom appointment · ${body.store ?? ''}`
        : `Enquiry (${type}) · ${name}`;

  const rows: [string, unknown][] = [
    ['Type', type],
    ['Name', name],
    ['Company', body.company],
    ['Email', email],
    ['Phone', body.phone],
    ['Language', body.locale],
    ['Product', product?.name],
    ['Frame finish', body.finish],
    ['Upholstery', body.fabric],
    ['Quantity', body.quantity],
    ['Delivery to', body.delivery],
    ['Store', body.store],
    ['Date', body.date],
    ['Time', body.slot],
    ['Message', body.message],
    ['Page', body.pageUrl],
  ];
  const text = rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
  const html = `<table cellpadding="6" style="font-family:sans-serif;font-size:14px">${rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="color:#5c6652">${k}</td><td>${esc(v).replace(/\n/g, '<br>')}</td></tr>`)
    .join('')}</table>`;

  const key = process.env.RESEND_API_KEY;
  const to = process.env.ENQUIRY_TO;
  if (key && to) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.ENQUIRY_FROM ?? 'VBamboo website <onboarding@resend.dev>',
        to: to.split(',').map((s) => s.trim()),
        reply_to: email,
        subject,
        text,
        html,
      }),
    });
    if (!res.ok) {
      console.error('[enquiry] email failed', res.status, await res.text());
      return NextResponse.json({ ok: false }, { status: 502 });
    }
  } else {
    console.log(`[enquiry] ${subject}\n${text}`);
  }
  return NextResponse.json({ ok: true });
}
