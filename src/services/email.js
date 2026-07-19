import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

let transporter = null;

function getTransport() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_HOST) {
    console.log('[EMAIL] No SMTP configured. Skipping email to', to);
    console.log('[EMAIL] Subject:', subject);
    return { skipped: true };
  }
  try {
    const info = await getTransport().sendMail({
      from: process.env.SMTP_FROM || 'noreply@acms.app',
      to,
      subject,
      html,
    });
    console.log('[EMAIL] Sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('[EMAIL] Failed:', err.message);
    throw err;
  }
}

export async function notifyNewBill(email, residentName, billDetails) {
  return sendEmail({
    to: email,
    subject: 'New Maintenance Bill Generated',
    html: `<h2>New Bill</h2><p>Hi ${residentName},</p><p>A new maintenance bill of <strong>${billDetails.currency || 'USD'} ${billDetails.amount}</strong> has been generated for period ${billDetails.period}.</p><p>Due date: ${billDetails.dueDate}</p>`,
  });
}

export async function notifyComplaintUpdate(email, residentName, complaintStatus) {
  return sendEmail({
    to: email,
    subject: 'Complaint Status Updated',
    html: `<h2>Complaint Update</h2><p>Hi ${residentName},</p><p>Your complaint status has been updated to: <strong>${complaintStatus}</strong>.</p>`,
  });
}

export async function notifyNewNotice(email, residentName, noticeTitle) {
  return sendEmail({
    to: email,
    subject: 'New Notice: ' + noticeTitle,
    html: `<h2>New Notice</h2><p>Hi ${residentName},</p><p>A new notice has been posted: <strong>${noticeTitle}</strong>.</p><p>Check the ACMS portal for details.</p>`,
  });
}
