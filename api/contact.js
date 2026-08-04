const nodemailer = require('nodemailer');

// Submitted values are interpolated into an HTML email, so escape them first.
const esc = (v) =>
  String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};

  // Honeypot: real users never see this field, bots fill it in.
  // Return 200 so the bot thinks it succeeded and doesn't retry.
  if (body.company) {
    return res.status(200).json({ ok: true });
  }

  // Only name + phone are required — the short form converts far better,
  // and we can always ask for details on the callback.
  if (!body.name || !body.phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const name = esc(body.name);
  const phone = esc(body.phone);
  const property = esc(body.property);
  const message = esc(body.message);
  const email = esc(body.email);

  // Only trust the address as a reply-to header if it actually looks like one —
  // stops newline-based header injection.
  const replyTo = /^[^\s@<>"]+@[^\s@<>".]+\.[^\s@<>"]+$/.test(String(body.email || '').trim())
    ? String(body.email).trim()
    : process.env.GMAIL_USER;

  // Subject uses the raw values (not HTML-escaped) with newlines stripped so a
  // submitted value can't inject extra mail headers.
  const oneLine = (v) => String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').trim();
  const subjectLine =
    `New Brush Removal Quote — ${oneLine(body.name)} | ${oneLine(body.property) || 'Not specified'}`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"TCR Landing Page" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    replyTo,
    subject: subjectLine,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a3d18;padding:24px 32px;">
          <h1 style="color:#fff;margin:0;font-size:22px;">New Quote Request</h1>
          <p style="color:rgba(255,255,255,.7);margin:6px 0 0;font-size:14px;">TCR Brush Removal — Landing Page</p>
        </div>
        <div style="padding:32px;border:1px solid #e2e2e2;border-top:none;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #eee;color:#6b7280;font-size:14px;width:140px;">Name</td>
              <td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;">${name}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #eee;color:#6b7280;font-size:14px;">Phone</td>
              <td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;"><a href="tel:${phone}" style="color:#2e5c28;">${phone}</a></td>
            </tr>
            ${email ? `<tr>
              <td style="padding:10px 0;border-bottom:1px solid #eee;color:#6b7280;font-size:14px;">Email</td>
              <td style="padding:10px 0;border-bottom:1px solid #eee;"><a href="mailto:${email}" style="color:#2e5c28;">${email}</a></td>
            </tr>` : ''}
            ${property ? `<tr>
              <td style="padding:10px 0;border-bottom:1px solid #eee;color:#6b7280;font-size:14px;">Property Type</td>
              <td style="padding:10px 0;border-bottom:1px solid #eee;">${property}</td>
            </tr>` : ''}
            ${message ? `<tr>
              <td style="padding:10px 0;color:#6b7280;font-size:14px;vertical-align:top;">Message</td>
              <td style="padding:10px 0;white-space:pre-wrap;">${message}</td>
            </tr>` : ''}
          </table>
          <div style="margin-top:28px;padding:16px 20px;background:#f0f0f0;font-size:13px;color:#6b7280;">
            Submitted from TCR Brush Removal landing page
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Mail error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
};
