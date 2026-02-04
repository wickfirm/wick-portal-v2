import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, teamSize, message, source = "contact_form" } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Get request metadata
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const referer = request.headers.get("referer") || "";

    // Parse UTM params from referer if present
    let utmSource, utmMedium, utmCampaign;
    try {
      const url = new URL(referer);
      utmSource = url.searchParams.get("utm_source") || undefined;
      utmMedium = url.searchParams.get("utm_medium") || undefined;
      utmCampaign = url.searchParams.get("utm_campaign") || undefined;
    } catch {
      // Ignore URL parsing errors
    }

    // Store lead in database
    const lead = await prisma.websiteLead.create({
      data: {
        name,
        email,
        company: company || null,
        teamSize: teamSize || null,
        message,
        source,
        sourceUrl: referer || null,
        utmSource,
        utmMedium,
        utmCampaign,
        ipAddress,
        userAgent,
      },
    });

    // Send notification email via Resend
    try {
      await resend.emails.send({
        from: "Omnixia <notifications@omnixia.ai>",
        to: ["mohamed@thewickfirm.com"], // Primary notification recipient
        subject: `New Lead: ${name} from ${company || "Unknown Company"}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0a0f2c, #1a1f3c); padding: 30px; border-radius: 12px 12px 0 0;">
              <h1 style="color: #00d4ff; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
            </div>

            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
              <h2 style="color: #1f2937; margin-top: 0;">Contact Details</h2>

              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; width: 120px;"><strong>Name:</strong></td>
                  <td style="padding: 10px 0; color: #1f2937;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280;"><strong>Email:</strong></td>
                  <td style="padding: 10px 0; color: #1f2937;"><a href="mailto:${email}" style="color: #00d4ff;">${email}</a></td>
                </tr>
                ${company ? `
                <tr>
                  <td style="padding: 10px 0; color: #6b7280;"><strong>Company:</strong></td>
                  <td style="padding: 10px 0; color: #1f2937;">${company}</td>
                </tr>
                ` : ""}
                ${teamSize ? `
                <tr>
                  <td style="padding: 10px 0; color: #6b7280;"><strong>Team Size:</strong></td>
                  <td style="padding: 10px 0; color: #1f2937;">${teamSize}</td>
                </tr>
                ` : ""}
              </table>

              <h3 style="color: #1f2937; margin-top: 20px;">Message</h3>
              <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <p style="color: #374151; margin: 0; white-space: pre-wrap;">${message}</p>
              </div>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  Lead ID: ${lead.id}<br>
                  Source: ${source}<br>
                  ${referer ? `Submitted from: ${referer}` : ""}
                </p>
              </div>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      // Log but don't fail the request if email fails
      console.error("Failed to send notification email:", emailError);
    }

    // Send confirmation email to the lead
    try {
      await resend.emails.send({
        from: "Omnixia <hello@omnixia.ai>",
        to: [email],
        subject: "Thanks for reaching out to Omnixia!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0a0f2c, #1a1f3c); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <img src="https://omnixia.ai/omnixia-logo.png" alt="Omnixia" style="height: 50px; margin-bottom: 15px;">
              <h1 style="color: #00d4ff; margin: 0; font-size: 24px;">Thanks for reaching out!</h1>
            </div>

            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Hi ${name.split(" ")[0]},
              </p>

              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Thank you for your interest in Omnixia! We've received your message and will get back to you within 24 hours.
              </p>

              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                In the meantime, feel free to explore our <a href="https://omnixia.ai/features" style="color: #00d4ff;">features</a> or check out our <a href="https://omnixia.ai/blog" style="color: #00d4ff;">blog</a> for insights on agency operations.
              </p>

              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 30px;">
                Best regards,<br>
                <strong>The Omnixia Team</strong>
              </p>
            </div>

            <div style="text-align: center; padding: 20px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Omnixia - The all-in-one operating system for modern agencies<br>
                <a href="https://omnixia.ai" style="color: #00d4ff;">omnixia.ai</a>
              </p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      // Log but don't fail if confirmation email fails
      console.error("Failed to send confirmation email:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for your message! We'll be in touch soon.",
      leadId: lead.id,
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to submit form. Please try again." },
      { status: 500 }
    );
  }
}
