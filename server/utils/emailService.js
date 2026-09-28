const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Create transporter only if host is provided to allow safe failure
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT === '465', 
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Sends an email asynchronously. Does not throw if SMTP is unconfigured.
 */
const sendEmail = async (to, subject, text, html) => {
  if (!transporter) {
    console.log(`[EmailService MOCK] Would have sent email to ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text: ${text}`);
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"CRDM System" <noreply@crdm.local>',
      to,
      subject,
      text,
      html
    });
    console.log(`[EmailService] Email sent successfully to ${to}. MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[EmailService] Failed to send email to ${to}:`, error.message);
    return false;
  }
};

module.exports = {
  sendEmail
};
