// Email utility for booking notifications
// Using a simple approach - can be upgraded to use services like SendGrid, Resend, etc.

type EmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail({ to, subject, html, text }: EmailParams): Promise<boolean> {
  // For now, log the email - in production, integrate with an email service
  console.log("📧 Email would be sent:", { to, subject });

  // If you have SMTP configured, you can use nodemailer:
  // const nodemailer = require('nodemailer');
  // const transporter = nodemailer.createTransport({...});
  // await transporter.sendMail({ from, to, subject, html, text });

  return true;
}

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
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #76527c 0%, #5a3d5e 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .content { background: #fff; border: 1px solid #e5e5e5; border-top: none; padding: 30px; border-radius: 0 0 12px 12px; }
        .detail-row { display: flex; margin-bottom: 16px; }
        .detail-label { color: #666; width: 100px; flex-shrink: 0; }
        .detail-value { font-weight: 500; }
        .meeting-link { display: inline-block; background: #76527c; color: white !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0; }
        .actions { margin-top: 24px; padding-top: 24px; border-top: 1px solid #eee; }
        .action-link { color: #76527c; margin-right: 16px; }
        .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0;font-size:24px;">Booking Confirmed!</h1>
          <p style="margin:10px 0 0;opacity:0.9;">${bookingTypeName}</p>
        </div>
        <div class="content">
          <p>Hi ${guestName},</p>
          <p>Your meeting has been confirmed. Here are the details:</p>

          <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;">
            <div class="detail-row">
              <span class="detail-label">📅 Date:</span>
              <span class="detail-value">${dateStr}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">🕐 Time:</span>
              <span class="detail-value">${timeStr}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">🌍 Timezone:</span>
              <span class="detail-value">${timezone}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">👤 With:</span>
              <span class="detail-value">${hostName}</span>
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
              <p style="color:#666;">${notes}</p>
            </div>
          ` : ''}

          <div class="actions">
            ${rescheduleUrl ? `<a href="${rescheduleUrl}" class="action-link">Reschedule</a>` : ''}
            ${cancelUrl ? `<a href="${cancelUrl}" class="action-link" style="color:#dc2626;">Cancel</a>` : ''}
          </div>
        </div>
        <div class="footer">
          <p>This booking was made through our online scheduling system.</p>
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
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #76527c 0%, #5a3d5e 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .content { background: #fff; border: 1px solid #e5e5e5; border-top: none; padding: 30px; border-radius: 0 0 12px 12px; }
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

          <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;">
            <p style="margin:0 0 10px;"><strong>📅 Date:</strong> ${dateStr}</p>
            <p style="margin:0 0 10px;"><strong>🕐 Time:</strong> ${timeStr}</p>
            <p style="margin:0 0 10px;"><strong>👤 Guest:</strong> ${guestName} (${guestEmail})</p>
          </div>

          ${meetingLink ? `
            <div style="text-align:center;margin:20px 0;">
              <a href="${meetingLink}" style="display:inline-block;background:#76527c;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Join Meeting</a>
            </div>
          ` : ''}

          ${notes ? `
            <div style="margin-top:20px;">
              <strong>Guest Notes:</strong>
              <p style="color:#666;">${notes}</p>
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

  // Send both emails
  await Promise.all([
    sendEmail({
      to: guestEmail,
      subject: `Confirmed: ${bookingTypeName} on ${dateStr}`,
      html: guestHtml,
    }),
    sendEmail({
      to: hostEmail,
      subject: `New Booking: ${guestName} - ${bookingTypeName}`,
      html: hostHtml,
    }),
  ]);
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

  // Notify the other party
  const recipientEmail = cancelledBy === "HOST" ? guestEmail : hostEmail;
  const recipientName = cancelledBy === "HOST" ? guestName : hostName;
  const cancellerName = cancelledBy === "HOST" ? hostName : guestName;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #fee2e2; color: #dc2626; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .content { background: #fff; border: 1px solid #e5e5e5; border-top: none; padding: 30px; border-radius: 0 0 12px 12px; }
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

          <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;">
            <p style="margin:0 0 10px;"><strong>${bookingTypeName}</strong></p>
            <p style="margin:0 0 10px;">📅 ${dateStr}</p>
            <p style="margin:0;">🕐 ${timeStr}</p>
          </div>

          ${reason ? `
            <div style="margin-top:20px;">
              <strong>Reason:</strong>
              <p style="color:#666;">${reason}</p>
            </div>
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: recipientEmail,
    subject: `Cancelled: ${bookingTypeName} on ${dateStr}`,
    html,
  });
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
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #76527c 0%, #5a3d5e 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .content { background: #fff; border: 1px solid #e5e5e5; border-top: none; padding: 30px; border-radius: 0 0 12px 12px; }
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

          <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;">
            <p style="margin:0 0 10px;"><strong>${bookingTypeName}</strong></p>
            <p style="margin:0 0 10px;">📅 ${dateStr}</p>
            <p style="margin:0 0 10px;">🕐 ${timeStr}</p>
            <p style="margin:0;">👤 With: ${hostName}</p>
          </div>

          ${meetingLink ? `
            <div style="text-align:center;margin:20px 0;">
              <a href="${meetingLink}" style="display:inline-block;background:#76527c;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Join Meeting</a>
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
