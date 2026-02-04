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
    </head>
    <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06);">
              <!-- Header with checkmark -->
              <tr>
                <td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px 40px 32px;text-align:center;">
                  <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:50%;text-align:center;vertical-align:middle;">
                          <span style="font-size:32px;line-height:64px;">&#10003;</span>
                        </td>
                      </tr>
                    </table>
                  </div>
                  <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">You're All Set!</h1>
                  <p style="margin:8px 0 0;font-size:15px;color:rgba(255,255,255,0.9);">Your meeting has been confirmed</p>
                </td>
              </tr>

              <!-- Meeting info card -->
              <tr>
                <td style="padding:32px 40px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
                    <tr>
                      <td style="padding:24px;">
                        <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#1e293b;">${bookingTypeName}</h2>

                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
                              <table role="presentation" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td style="width:24px;vertical-align:top;padding-right:12px;">
                                    <span style="font-size:16px;">&#128197;</span>
                                  </td>
                                  <td>
                                    <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Date</div>
                                    <div style="font-size:15px;font-weight:500;color:#1e293b;">${dateStr}</div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
                              <table role="presentation" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td style="width:24px;vertical-align:top;padding-right:12px;">
                                    <span style="font-size:16px;">&#128336;</span>
                                  </td>
                                  <td>
                                    <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Time</div>
                                    <div style="font-size:15px;font-weight:500;color:#1e293b;">${timeStr}</div>
                                    <div style="font-size:13px;color:#64748b;margin-top:2px;">${timezone}</div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:10px 0;">
                              <table role="presentation" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td style="width:24px;vertical-align:top;padding-right:12px;">
                                    <span style="font-size:16px;">&#128100;</span>
                                  </td>
                                  <td>
                                    <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Meeting With</div>
                                    <div style="font-size:15px;font-weight:500;color:#1e293b;">${hostName}</div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  ${meetingLink ? `
                  <!-- Join Meeting Button -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;">
                    <tr>
                      <td align="center">
                        <a href="${meetingLink}" style="display:inline-block;background:linear-gradient(135deg,#76527c 0%,#5a3d5e 100%);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;box-shadow:0 2px 4px rgba(118,82,124,0.3);">Join Meeting</a>
                      </td>
                    </tr>
                  </table>
                  ` : ''}

                  ${notes ? `
                  <!-- Notes -->
                  <div style="margin-top:24px;padding:16px;background:#fffbeb;border-radius:8px;border:1px solid #fde68a;">
                    <div style="font-size:12px;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Notes</div>
                    <div style="font-size:14px;color:#78350f;">${notes}</div>
                  </div>
                  ` : ''}
                </td>
              </tr>

              ${(rescheduleUrl || cancelUrl) ? `
              <!-- Action buttons -->
              <tr>
                <td style="padding:0 40px 32px;text-align:center;">
                  <div style="border-top:1px solid #e2e8f0;padding-top:24px;">
                    <span style="font-size:13px;color:#64748b;">Need to make changes?</span>
                    <div style="margin-top:12px;">
                      ${rescheduleUrl ? `<a href="${rescheduleUrl}" style="display:inline-block;color:#76527c;font-size:14px;font-weight:500;text-decoration:none;padding:8px 16px;border:1px solid #76527c;border-radius:6px;margin:0 4px;">Reschedule</a>` : ''}
                      ${cancelUrl ? `<a href="${cancelUrl}" style="display:inline-block;color:#dc2626;font-size:14px;font-weight:500;text-decoration:none;padding:8px 16px;border:1px solid #dc2626;border-radius:6px;margin:0 4px;">Cancel</a>` : ''}
                    </div>
                  </div>
                </td>
              </tr>
              ` : ''}

              <!-- Footer -->
              <tr>
                <td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                  ${agencyLogo ? `<img src="${agencyLogo}" alt="${agencyName}" style="height:28px;margin-bottom:12px;">` : `<div style="font-size:14px;font-weight:600;color:#64748b;margin-bottom:8px;">${agencyName}</div>`}
                  <p style="margin:0;font-size:12px;color:#94a3b8;">This booking was scheduled through ${agencyName}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
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
    </head>
    <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06);">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#76527c 0%,#5a3d5e 100%);padding:32px 40px;text-align:center;">
                  <div style="display:inline-block;background:rgba(255,255,255,0.15);padding:8px 16px;border-radius:20px;margin-bottom:16px;">
                    <span style="font-size:13px;color:#ffffff;font-weight:500;">NEW BOOKING</span>
                  </div>
                  <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">${bookingTypeName}</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding:32px 40px;">
                  <p style="margin:0 0 24px;font-size:15px;color:#475569;">Hi ${hostName}, you have a new booking from <strong style="color:#1e293b;">${guestName}</strong>.</p>

                  <!-- Guest Info Card -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#f0fdf4 0%,#ecfdf5 100%);border-radius:12px;border:1px solid #bbf7d0;margin-bottom:20px;">
                    <tr>
                      <td style="padding:20px;">
                        <table role="presentation" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="vertical-align:top;">
                              <div style="width:48px;height:48px;background:linear-gradient(135deg,#10b981 0%,#059669 100%);border-radius:50%;text-align:center;line-height:48px;color:#ffffff;font-size:18px;font-weight:600;">${guestName.charAt(0).toUpperCase()}</div>
                            </td>
                            <td style="padding-left:16px;vertical-align:middle;">
                              <div style="font-size:16px;font-weight:600;color:#1e293b;">${guestName}</div>
                              <div style="font-size:14px;color:#64748b;">${guestEmail}</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Meeting Details -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
                    <tr>
                      <td style="padding:20px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="padding:8px 0;">
                              <table role="presentation" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td style="width:40px;height:40px;background:#ede9fe;border-radius:8px;text-align:center;vertical-align:middle;">
                                    <span style="font-size:18px;">&#128197;</span>
                                  </td>
                                  <td style="padding-left:14px;">
                                    <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Date</div>
                                    <div style="font-size:15px;font-weight:500;color:#1e293b;">${dateStr}</div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:8px 0;">
                              <table role="presentation" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td style="width:40px;height:40px;background:#fce7f3;border-radius:8px;text-align:center;vertical-align:middle;">
                                    <span style="font-size:18px;">&#128336;</span>
                                  </td>
                                  <td style="padding-left:14px;">
                                    <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Time</div>
                                    <div style="font-size:15px;font-weight:500;color:#1e293b;">${timeStr}</div>
                                    <div style="font-size:12px;color:#94a3b8;">${timezone}</div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  ${meetingLink ? `
                  <!-- Join Meeting Button -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;">
                    <tr>
                      <td align="center">
                        <a href="${meetingLink}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;box-shadow:0 2px 4px rgba(59,130,246,0.3);">Join Meeting</a>
                      </td>
                    </tr>
                  </table>
                  ` : ''}

                  ${notes ? `
                  <!-- Guest Notes -->
                  <div style="margin-top:24px;padding:16px;background:#fffbeb;border-radius:8px;border:1px solid #fde68a;">
                    <div style="font-size:12px;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Guest Notes</div>
                    <div style="font-size:14px;color:#78350f;">${notes}</div>
                  </div>
                  ` : ''}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                  <a href="https://wick.omnixia.ai/bookings" style="display:inline-block;color:#76527c;font-size:14px;font-weight:500;text-decoration:none;">View All Bookings &rarr;</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
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
    </head>
    <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06);">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);padding:40px 40px 32px;text-align:center;">
                  <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                    <tr>
                      <td style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:50%;text-align:center;vertical-align:middle;">
                        <span style="font-size:32px;line-height:64px;color:#ffffff;">&#10005;</span>
                      </td>
                    </tr>
                  </table>
                  <h1 style="margin:20px 0 0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Meeting Cancelled</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding:32px 40px;">
                  <p style="margin:0 0 24px;font-size:15px;color:#475569;">Hi ${recipientName}, the following meeting has been cancelled by <strong style="color:#1e293b;">${cancellerName}</strong>.</p>

                  <!-- Cancelled Meeting Card -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fef2f2;border-radius:12px;border:1px solid #fecaca;">
                    <tr>
                      <td style="padding:24px;">
                        <div style="text-decoration:line-through;opacity:0.7;">
                          <h3 style="margin:0 0 16px;font-size:17px;font-weight:600;color:#991b1b;">${bookingTypeName}</h3>
                          <table role="presentation" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="padding:6px 0;">
                                <span style="font-size:14px;color:#991b1b;">&#128197; ${dateStr}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:6px 0;">
                                <span style="font-size:14px;color:#991b1b;">&#128336; ${timeStr}</span>
                              </td>
                            </tr>
                          </table>
                        </div>
                      </td>
                    </tr>
                  </table>

                  ${reason ? `
                  <!-- Reason -->
                  <div style="margin-top:24px;padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
                    <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Reason for cancellation</div>
                    <div style="font-size:14px;color:#475569;">${reason}</div>
                  </div>
                  ` : ''}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                  <p style="margin:0;font-size:13px;color:#94a3b8;">If you have any questions, please contact the other party directly.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
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

export async function sendBookingReschedule({
  guestName,
  guestEmail,
  hostName,
  hostEmail,
  bookingTypeName,
  oldStartTime,
  newStartTime,
  newEndTime,
  timezone,
  meetingLink,
  rescheduleUrl,
  cancelUrl,
}: {
  guestName: string;
  guestEmail: string;
  hostName: string;
  hostEmail: string;
  bookingTypeName: string;
  oldStartTime: Date;
  newStartTime: Date;
  newEndTime: Date;
  timezone: string;
  meetingLink?: string;
  rescheduleUrl?: string;
  cancelUrl?: string;
}): Promise<void> {
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

  const oldDateStr = formatDate(oldStartTime);
  const oldTimeStr = formatTime(oldStartTime);
  const newDateStr = formatDate(newStartTime);
  const newTimeStr = `${formatTime(newStartTime)} - ${formatTime(newEndTime)}`;

  // Generate HTML for a recipient
  const generateHtml = (recipientName: string, isHost: boolean) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06);">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%);padding:40px 40px 32px;text-align:center;">
                  <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                    <tr>
                      <td style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:50%;text-align:center;vertical-align:middle;">
                        <span style="font-size:28px;line-height:64px;color:#ffffff;">&#8634;</span>
                      </td>
                    </tr>
                  </table>
                  <h1 style="margin:20px 0 0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Meeting Rescheduled</h1>
                  <p style="margin:8px 0 0;font-size:15px;color:rgba(255,255,255,0.9);">${bookingTypeName}</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding:32px 40px;">
                  <p style="margin:0 0 24px;font-size:15px;color:#475569;">Hi ${recipientName}, ${isHost ? `<strong style="color:#1e293b;">${guestName}</strong> has` : 'your meeting has been'} rescheduled to a new time.</p>

                  <!-- Time Change Card -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                    <!-- Old Time -->
                    <tr>
                      <td style="padding:16px;background:#fef2f2;border-radius:12px 12px 0 0;border:1px solid #fecaca;border-bottom:none;">
                        <table role="presentation" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="width:32px;vertical-align:top;">
                              <span style="font-size:18px;opacity:0.5;">&#128197;</span>
                            </td>
                            <td style="opacity:0.6;">
                              <div style="font-size:11px;color:#991b1b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Previous Time</div>
                              <div style="font-size:14px;color:#991b1b;text-decoration:line-through;">${oldDateStr} at ${oldTimeStr}</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <!-- Arrow -->
                    <tr>
                      <td style="text-align:center;background:linear-gradient(to bottom,#fef2f2 50%,#f0fdf4 50%);padding:0;">
                        <div style="display:inline-block;background:#ffffff;border:2px solid #e2e8f0;border-radius:50%;width:32px;height:32px;line-height:28px;font-size:16px;">&#8595;</div>
                      </td>
                    </tr>
                    <!-- New Time -->
                    <tr>
                      <td style="padding:16px;background:#f0fdf4;border-radius:0 0 12px 12px;border:1px solid #bbf7d0;border-top:none;">
                        <table role="presentation" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="width:32px;vertical-align:top;">
                              <span style="font-size:18px;">&#9989;</span>
                            </td>
                            <td>
                              <div style="font-size:11px;color:#166534;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">New Time</div>
                              <div style="font-size:15px;font-weight:600;color:#166534;">${newDateStr}</div>
                              <div style="font-size:14px;color:#166534;margin-top:2px;">${newTimeStr}</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Additional Details -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
                    <tr>
                      <td style="padding:16px;">
                        <table role="presentation" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="padding:4px 0;">
                              <span style="font-size:13px;color:#64748b;">&#127760; Timezone:</span>
                              <span style="font-size:13px;color:#1e293b;font-weight:500;margin-left:8px;">${timezone}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:4px 0;">
                              <span style="font-size:13px;color:#64748b;">&#128100; ${isHost ? 'Guest:' : 'With:'}</span>
                              <span style="font-size:13px;color:#1e293b;font-weight:500;margin-left:8px;">${isHost ? `${guestName} (${guestEmail})` : hostName}</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  ${meetingLink ? `
                  <!-- Join Meeting Button -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;">
                    <tr>
                      <td align="center">
                        <a href="${meetingLink}" style="display:inline-block;background:linear-gradient(135deg,#76527c 0%,#5a3d5e 100%);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;box-shadow:0 2px 4px rgba(118,82,124,0.3);">Join Meeting</a>
                      </td>
                    </tr>
                  </table>
                  ` : ''}
                </td>
              </tr>

              ${!isHost && (rescheduleUrl || cancelUrl) ? `
              <!-- Action buttons -->
              <tr>
                <td style="padding:0 40px 32px;text-align:center;">
                  <div style="border-top:1px solid #e2e8f0;padding-top:24px;">
                    <span style="font-size:13px;color:#64748b;">Need to make more changes?</span>
                    <div style="margin-top:12px;">
                      ${rescheduleUrl ? `<a href="${rescheduleUrl}" style="display:inline-block;color:#76527c;font-size:14px;font-weight:500;text-decoration:none;padding:8px 16px;border:1px solid #76527c;border-radius:6px;margin:0 4px;">Reschedule Again</a>` : ''}
                      ${cancelUrl ? `<a href="${cancelUrl}" style="display:inline-block;color:#dc2626;font-size:14px;font-weight:500;text-decoration:none;padding:8px 16px;border:1px solid #dc2626;border-radius:6px;margin:0 4px;">Cancel</a>` : ''}
                    </div>
                  </div>
                </td>
              </tr>
              ` : ''}

              <!-- Footer -->
              <tr>
                <td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                  <p style="margin:0;font-size:13px;color:#94a3b8;">Please add this updated time to your calendar.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Send reschedule email to BOTH guest and host
  console.log(`📧 Sending reschedule notification to guest: ${guestEmail} and host: ${hostEmail}`);

  await Promise.all([
    sendEmail({
      to: guestEmail,
      subject: `Rescheduled: ${bookingTypeName} - ${newDateStr}`,
      html: generateHtml(guestName, false),
    }),
    sendEmail({
      to: hostEmail,
      subject: `Rescheduled: ${guestName} - ${bookingTypeName}`,
      html: generateHtml(hostName, true),
      replyTo: guestEmail,
    }),
  ]);
}

// ===========================================
// HR EMAILS
// ===========================================

export async function sendLeaveRequestNotification({
  employeeName,
  employeeEmail,
  leaveType,
  startDate,
  endDate,
  totalDays,
  reason,
  managementEmail,
  approvalUrl,
}: {
  employeeName: string;
  employeeEmail: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason?: string;
  managementEmail: string;
  approvalUrl: string;
}): Promise<void> {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const startDateStr = formatDate(startDate);
  const endDateStr = formatDate(endDate);
  const leaveTypeLabel = leaveType === "ANNUAL" ? "Annual Leave" : leaveType === "SICK" ? "Sick Leave" : leaveType === "UNPAID" ? "Unpaid Leave" : leaveType;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06);">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:32px 40px;text-align:center;">
                  <div style="display:inline-block;background:rgba(255,255,255,0.15);padding:8px 16px;border-radius:20px;margin-bottom:16px;">
                    <span style="font-size:13px;color:#ffffff;font-weight:500;">LEAVE REQUEST</span>
                  </div>
                  <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">New Time-Off Request</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding:32px 40px;">
                  <!-- Employee Info -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);border-radius:12px;border:1px solid #bfdbfe;margin-bottom:24px;">
                    <tr>
                      <td style="padding:20px;">
                        <table role="presentation" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="vertical-align:top;">
                              <div style="width:48px;height:48px;background:linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%);border-radius:50%;text-align:center;line-height:48px;color:#ffffff;font-size:18px;font-weight:600;">${employeeName.charAt(0).toUpperCase()}</div>
                            </td>
                            <td style="padding-left:16px;vertical-align:middle;">
                              <div style="font-size:16px;font-weight:600;color:#1e293b;">${employeeName}</div>
                              <div style="font-size:14px;color:#64748b;">${employeeEmail}</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Leave Details -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
                    <tr>
                      <td style="padding:24px;">
                        <h3 style="margin:0 0 16px;font-size:14px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Request Details</h3>

                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
                              <table role="presentation" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td style="width:40px;height:40px;background:#fef3c7;border-radius:8px;text-align:center;vertical-align:middle;">
                                    <span style="font-size:18px;">&#127796;</span>
                                  </td>
                                  <td style="padding-left:14px;">
                                    <div style="font-size:12px;color:#64748b;">Leave Type</div>
                                    <div style="font-size:15px;font-weight:600;color:#1e293b;">${leaveTypeLabel}</div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
                              <table role="presentation" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td style="width:40px;height:40px;background:#dcfce7;border-radius:8px;text-align:center;vertical-align:middle;">
                                    <span style="font-size:18px;">&#128197;</span>
                                  </td>
                                  <td style="padding-left:14px;">
                                    <div style="font-size:12px;color:#64748b;">Start Date</div>
                                    <div style="font-size:15px;font-weight:500;color:#1e293b;">${startDateStr}</div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
                              <table role="presentation" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td style="width:40px;height:40px;background:#fce7f3;border-radius:8px;text-align:center;vertical-align:middle;">
                                    <span style="font-size:18px;">&#128197;</span>
                                  </td>
                                  <td style="padding-left:14px;">
                                    <div style="font-size:12px;color:#64748b;">End Date</div>
                                    <div style="font-size:15px;font-weight:500;color:#1e293b;">${endDateStr}</div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:10px 0;">
                              <table role="presentation" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td style="width:40px;height:40px;background:#e0e7ff;border-radius:8px;text-align:center;vertical-align:middle;">
                                    <span style="font-size:18px;">&#128337;</span>
                                  </td>
                                  <td style="padding-left:14px;">
                                    <div style="font-size:12px;color:#64748b;">Total Days</div>
                                    <div style="font-size:15px;font-weight:600;color:#1e293b;">${totalDays} working day${totalDays === 1 ? '' : 's'}</div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  ${reason ? `
                  <!-- Reason -->
                  <div style="margin-top:20px;padding:16px;background:#fffbeb;border-radius:8px;border:1px solid #fde68a;">
                    <div style="font-size:12px;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Reason</div>
                    <div style="font-size:14px;color:#78350f;">${reason}</div>
                  </div>
                  ` : ''}

                  <!-- Action Button -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:28px;">
                    <tr>
                      <td align="center">
                        <a href="${approvalUrl}" style="display:inline-block;background:linear-gradient(135deg,#76527c 0%,#5a3d5e 100%);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;box-shadow:0 2px 4px rgba(118,82,124,0.3);">Review Request</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                  <p style="margin:0;font-size:13px;color:#94a3b8;">This is an automated notification from The Wick Firm HR System</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  console.log(`📧 Sending leave request notification to management: ${managementEmail}`);

  await sendEmail({
    to: managementEmail,
    subject: `Leave Request: ${employeeName} - ${leaveTypeLabel} (${totalDays} day${totalDays === 1 ? '' : 's'})`,
    html,
    replyTo: employeeEmail,
  });
}

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
