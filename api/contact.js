const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, phone, email, property, message } = req.body;

  if (!name || !phone || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

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
    replyTo: email || process.env.GMAIL_USER,
    subject: `New Brush Removal Quote — ${name} | ${property || 'Not specified'}`,
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
            <tr>
              <td style="padding:10px 0;color:#6b7280;font-size:14px;vertical-align:top;">Message</td>
              <td style="padding:10px 0;white-space:pre-wrap;">${message}</td>
            </tr>
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
