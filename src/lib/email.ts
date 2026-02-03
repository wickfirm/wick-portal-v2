// Email utility using Resend
// Handles all transactional emails: bookings, notifications, client communications

import { Resend } from "resend";

// Lazy-load Resend to avoid build-time errors when no API key is set
let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

const FROM_EMAIL = process.env.EMAIL_FROM || "Wick <onboarding@resend.dev>";

type EmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export async function sendEmail({ to, subject, html, text, replyTo }: EmailParams): Promise<boolean> {
  const resend = getResend();

  // If no API key, log and return (development mode)
  if (!resend) {
    console.log("📧 [DEV] Email would be sent:", { to, subject });
    return true;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      replyTo,
    });

    if (error) {
      console.error("Error sending email:", error);
      return false;
    }

    console.log("📧 Email sent successfully:", data?.id);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

// ===========================================
// BOOKING EMAILS
// ===========================================

type BookingConfirmationParams = {
  guestName: string;
  guestEmail: string;
  hostName: string;
  hostEmail: string;
  bookingTypeName: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  meetingLink?: string;
  notes?: string;
  cancelUrl?: string;
  rescheduleUrl?: string;
  agencyName?: string;
  agencyLogo?: string;
};

export async function sendBookingConfirmation({
  guestName,
  guestEmail,
  hostName,
  hostEmail,
  bookingTypeName,
  startTime,
  endTime,
  timezone,
  meetingLink,
  notes,
  cancelUrl,
  rescheduleUrl,
  agencyName = "Wick",
  agencyLogo,
}: BookingConfirmationParams): Promise<void> {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: timezone,
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timezone,
    });
  };

  const dateStr = formatDate(startTime);
  const timeStr = `${formatTime(startTime)} - ${formatTime(endTime)}`;

  // Email to guest
  const guestHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #76527c 0%, #5a3d5e 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .content { background: #fff; border: 1px solid #e5e5e5; border-top: none; padding: 30px; border-radius: 0 0 12px 12px; }
        .detail-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { margin-bottom: 12px; }
        .detail-label { color: #666; font-size: 13px; }
        .detail-value { font-weight: 500; font-size: 15px; }
        .meeting-link { display: inline-block; background: #76527c; color: white !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; margin: 20px 0; }
        .actions { margin-top: 24px; padding-top: 24px; border-top: 1px solid #eee; text-align: center; }
        .action-link { color: #76527c; margin: 0 12px; font-size: 14px; }
        .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${agencyLogo ? `<img src="${agencyLogo}" alt="${agencyName}" style="height:40px;margin-bottom:16px;">` : ''}
          <h1 style="margin:0;font-size:24px;">Booking Confirmed!</h1>
          <p style="margin:10px 0 0;opacity:0.9;">${bookingTypeName}</p>
        </div>
        <div class="content">
          <p>Hi ${guestName},</p>
          <p>Your meeting has been confirmed. Here are the details:</p>

          <div class="detail-box">
            <div class="detail-row">
              <div class="detail-label">📅 Date</div>
              <div class="detail-value">${dateStr}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">🕐 Time</div>
              <div class="detail-value">${timeStr}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">🌍 Timezone</div>
              <div class="detail-value">${timezone}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">👤 With</div>
              <div class="detail-value">${hostName}</div>
            </div>
          </div>

          ${meetingLink ? `
            <div style="text-align:center;">
              <a href="${meetingLink}" class="meeting-link">Join Meeting</a>
            </div>
          ` : ''}

          ${notes ? `
            <div style="margin-top:20px;">
              <strong>Notes:</strong>
              <p style="color:#666;margin:8px 0 0;">${notes}</p>
            </div>
          ` : ''}

          ${cancelUrl ? `
          <div class="actions">
            <a href="${cancelUrl}" class="action-link" style="color:#dc2626;">Cancel Booking</a>
          </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>This booking was made through ${agencyName}.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Email to host
  const hostHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #76527c 0%, #5a3d5e 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .content { background: #fff; border: 1px solid #e5e5e5; border-top: none; padding: 30px; border-radius: 0 0 12px 12px; }
        .detail-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0;font-size:24px;">New Booking</h1>
          <p style="margin:10px 0 0;opacity:0.9;">${bookingTypeName}</p>
        </div>
        <div class="content">
          <p>Hi ${hostName},</p>
          <p>You have a new booking from <strong>${guestName}</strong>.</p>

          <div class="detail-box">
            <p style="margin:0 0 10px;"><strong>📅 Date:</strong> ${dateStr}</p>
            <p style="margin:0 0 10px;"><strong>🕐 Time:</strong> ${timeStr}</p>
            <p style="margin:0 0 10px;"><strong>👤 Guest:</strong> ${guestName}</p>
            <p style="margin:0;"><strong>📧 Email:</strong> ${guestEmail}</p>
          </div>

          ${meetingLink ? `
            <div style="text-align:center;margin:20px 0;">
              <a href="${meetingLink}" style="display:inline-block;background:#76527c;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:500;">Join Meeting</a>
            </div>
          ` : ''}

          ${notes ? `
            <div style="margin-top:20px;">
              <strong>Guest Notes:</strong>
              <p style="color:#666;margin:8px 0 0;">${notes}</p>
            </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>View all your bookings in the Wick Portal.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send both emails in parallel
  console.log(`📧 Sending booking confirmation to guest: ${guestEmail} and host: ${hostEmail}`);

  const results = await Promise.all([
    sendEmail({
      to: guestEmail,
      subject: `Confirmed: ${bookingTypeName} on ${dateStr}`,
      html: guestHtml,
    }),
    sendEmail({
      to: hostEmail,
      subject: `New Booking: ${guestName} - ${bookingTypeName}`,
      html: hostHtml,
      replyTo: guestEmail,
    }),
  ]);

  console.log(`📧 Email results - Guest: ${results[0]}, Host: ${results[1]}`);
}

export async function sendBookingCancellation({
  guestName,
  guestEmail,
  hostName,
  hostEmail,
  bookingTypeName,
  startTime,
  timezone,
  cancelledBy,
  reason,
}: {
  guestName: string;
  guestEmail: string;
  hostName: string;
  hostEmail: string;
  bookingTypeName: string;
  startTime: Date;
  timezone: string;
  cancelledBy: "HOST" | "GUEST";
  reason?: string;
}): Promise<void> {
  const dateStr = startTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: timezone,
  });

  const timeStr = startTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  });

  const cancellerName = cancelledBy === "HOST" ? hostName : guestName;

  // Generate HTML for a recipient
  const generateHtml = (recipientName: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #fee2e2; color: #dc2626; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .content { background: #fff; border: 1px solid #e5e5e5; border-top: none; padding: 30px; border-radius: 0 0 12px 12px; }
        .detail-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0;font-size:24px;">Booking Cancelled</h1>
        </div>
        <div class="content">
          <p>Hi ${recipientName},</p>
          <p>The following meeting has been cancelled by ${cancellerName}:</p>

          <div class="detail-box">
            <p style="margin:0 0 10px;font-weight:600;">${bookingTypeName}</p>
            <p style="margin:0 0 8px;">📅 ${dateStr}</p>
            <p style="margin:0;">🕐 ${timeStr}</p>
          </div>

          ${reason ? `
            <div style="margin-top:20px;">
              <strong>Reason:</strong>
              <p style="color:#666;margin:8px 0 0;">${reason}</p>
            </div>
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `;

  // Send cancellation email to BOTH guest and host
  await Promise.all([
    sendEmail({
      to: guestEmail,
      subject: `Cancelled: ${bookingTypeName} on ${dateStr}`,
      html: generateHtml(guestName),
    }),
    sendEmail({
      to: hostEmail,
      subject: `Cancelled: ${bookingTypeName} on ${dateStr}`,
      html: generateHtml(hostName),
    }),
  ]);
}

export async function sendBookingReminder({
  guestName,
  guestEmail,
  hostName,
  bookingTypeName,
  startTime,
  timezone,
  meetingLink,
}: {
  guestName: string;
  guestEmail: string;
  hostName: string;
  bookingTypeName: string;
  startTime: Date;
  timezone: string;
  meetingLink?: string;
}): Promise<void> {
  const dateStr = startTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: timezone,
  });

  const timeStr = startTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #76527c 0%, #5a3d5e 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .content { background: #fff; border: 1px solid #e5e5e5; border-top: none; padding: 30px; border-radius: 0 0 12px 12px; }
        .detail-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0;font-size:24px;">⏰ Meeting Reminder</h1>
        </div>
        <div class="content">
          <p>Hi ${guestName},</p>
          <p>This is a reminder about your upcoming meeting:</p>

          <div class="detail-box">
            <p style="margin:0 0 10px;font-weight:600;">${bookingTypeName}</p>
            <p style="margin:0 0 8px;">📅 ${dateStr}</p>
            <p style="margin:0 0 8px;">🕐 ${timeStr}</p>
            <p style="margin:0;">👤 With: ${hostName}</p>
          </div>

          ${meetingLink ? `
            <div style="text-align:center;margin:20px 0;">
              <a href="${meetingLink}" style="display:inline-block;background:#76527c;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:500;">Join Meeting</a>
            </div>
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: guestEmail,
    subject: `Reminder: ${bookingTypeName} - ${dateStr} at ${timeStr}`,
    html,
  });
}

// ===========================================
// INTERNAL NOTIFICATION EMAILS
// ===========================================

export async function sendTaskAssignmentEmail({
  assigneeName,
  assigneeEmail,
  taskTitle,
  clientName,
  dueDate,
  assignedBy,
  taskUrl,
}: {
  assigneeName: string;
  assigneeEmail: string;
  taskTitle: string;
  clientName?: string;
  dueDate?: Date;
  assignedBy: string;
  taskUrl: string;
}): Promise<void> {
  const dueDateStr = dueDate
    ? dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #76527c 0%, #5a3d5e 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0; }
        .content { background: #fff; border: 1px solid #e5e5e5; border-top: none; padding: 24px; border-radius: 0 0 12px 12px; }
        .task-box { background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #76527c; }
        .btn { display: inline-block; background: #76527c; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin:0;font-size:20px;">New Task Assigned</h2>
        </div>
        <div class="content">
          <p>Hi ${assigneeName},</p>
          <p>${assignedBy} has assigned you a new task:</p>

          <div class="task-box">
            <div style="font-weight:600;font-size:16px;margin-bottom:8px;">${taskTitle}</div>
            ${clientName ? `<div style="color:#666;font-size:14px;">Client: ${clientName}</div>` : ''}
            ${dueDateStr ? `<div style="color:#666;font-size:14px;">Due: ${dueDateStr}</div>` : ''}
          </div>

          <div style="text-align:center;margin-top:24px;">
            <a href="${taskUrl}" class="btn">View Task</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: assigneeEmail,
    subject: `New Task: ${taskTitle}`,
    html,
  });
}

export async function sendTimesheetReminderEmail({
  userName,
  userEmail,
  weekEnding,
  hoursLogged,
  targetHours,
}: {
  userName: string;
  userEmail: string;
  weekEnding: string;
  hoursLogged: number;
  targetHours: number;
}): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #76527c 0%, #5a3d5e 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center; }
        .content { background: #fff; border: 1px solid #e5e5e5; border-top: none; padding: 24px; border-radius: 0 0 12px 12px; }
        .stats { display: flex; justify-content: center; gap: 32px; margin: 20px 0; }
        .stat { text-align: center; }
        .stat-value { font-size: 28px; font-weight: 600; color: #76527c; }
        .stat-label { font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin:0;">⏰ Timesheet Reminder</h2>
          <p style="margin:8px 0 0;opacity:0.9;">Week ending ${weekEnding}</p>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>Don't forget to complete your timesheet for this week!</p>

          <div class="stats">
            <div class="stat">
              <div class="stat-value">${hoursLogged}h</div>
              <div class="stat-label">Logged</div>
            </div>
            <div class="stat">
              <div class="stat-value">${targetHours}h</div>
              <div class="stat-label">Target</div>
            </div>
          </div>

          <div style="text-align:center;margin-top:24px;">
            <a href="https://wick.omnixia.ai/timesheet" style="display:inline-block;background:#76527c;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500;">Update Timesheet</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: userEmail,
    subject: `Timesheet Reminder - Week ending ${weekEnding}`,
    html,
  });
}

// ===========================================
// CLIENT COMMUNICATION EMAILS
// ===========================================

export async function sendClientEmail({
  clientName,
  clientEmail,
  subject,
  message,
  senderName,
  senderEmail,
  agencyName = "Wick",
}: {
  clientName: string;
  clientEmail: string;
  subject: string;
  message: string;
  senderName: string;
  senderEmail: string;
  agencyName?: string;
}): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .content { background: #fff; border: 1px solid #e5e5e5; padding: 30px; border-radius: 12px; }
        .footer { margin-top: 24px; padding-top: 24px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          <p>Hi ${clientName},</p>

          <div style="white-space:pre-wrap;">${message}</div>

          <div class="footer">
            <p style="margin:0;">Best regards,<br><strong>${senderName}</strong><br>${agencyName}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: clientEmail,
    subject,
    html,
    replyTo: senderEmail,
  });
}
