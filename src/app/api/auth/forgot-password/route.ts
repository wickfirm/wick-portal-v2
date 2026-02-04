import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

// Initialize Resend lazily to avoid build errors when API key is not set
let resend: Resend | null = null;
function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      console.log("Password reset requested for non-existent email:", email);
      return NextResponse.json({ success: true });
    }

    if (!user.isActive) {
      console.log("Password reset requested for inactive user:", email);
      return NextResponse.json({ success: true });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Delete any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: email.toLowerCase() },
    });

    // Create new token
    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        token,
        expiresAt,
      },
    });

    // Determine the base URL
    const baseUrl = process.env.NEXTAUTH_URL || "https://wick.omnixia.ai";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Send email
    const resendClient = getResend();
    if (!resendClient) {
      console.error("Resend API key not configured");
      return NextResponse.json({ success: true }); // Still return success to prevent email enumeration
    }

    await resendClient.emails.send({
      from: process.env.EMAIL_FROM || "The Wick Firm <noreply@thewickfirm.com>",
      to: email,
      subject: "Reset your password",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f7fa;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f7fa; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(118, 82, 124, 0.08);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #76527c, #5f4263); padding: 32px 40px; text-align: center;">
                      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 500;">
                        Password Reset
                      </h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px; color: #333; font-size: 16px; line-height: 1.6;">
                        Hi${user.name ? ` ${user.name.split(" ")[0]}` : ""},
                      </p>
                      <p style="margin: 0 0 24px; color: #5f6368; font-size: 15px; line-height: 1.6;">
                        We received a request to reset your password for your Wick Portal account. Click the button below to create a new password:
                      </p>

                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                        <tr>
                          <td align="center">
                            <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #76527c, #5f4263); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px;">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 24px 0 0; color: #9aa0a6; font-size: 13px; line-height: 1.6;">
                        This link will expire in <strong style="color: #5f6368;">1 hour</strong>. If you didn't request this, you can safely ignore this email.
                      </p>

                      <!-- Alternative Link -->
                      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e8eaed;">
                        <p style="margin: 0; color: #9aa0a6; font-size: 12px; line-height: 1.6;">
                          If the button doesn't work, copy and paste this link into your browser:
                        </p>
                        <p style="margin: 8px 0 0; word-break: break-all;">
                          <a href="${resetUrl}" style="color: #76527c; font-size: 12px; text-decoration: none;">
                            ${resetUrl}
                          </a>
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background: #f8f7fa; padding: 24px 40px; text-align: center; border-top: 1px solid #e8eaed;">
                      <p style="margin: 0; color: #9aa0a6; font-size: 12px;">
                        &copy; ${new Date().getFullYear()} The Wick Firm. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Password reset email sent to:", email);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
