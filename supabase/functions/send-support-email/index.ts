import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SupportRequest {
  subject: string;
  message: string;
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { subject, message, userId }: SupportRequest = await req.json();

    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch user details
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      throw new Error(`User not found: ${userError?.message}`);
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
    }

    const userEmail = user.email || "No email";
    const companyName = profile?.company_name || "No company name";
    const websiteUrl = profile?.website_url || "No website";
    const userType = profile?.user_type || "business";
    const agencyId = profile?.agency_id || "N/A";

    // Build email HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Support Request</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #EF2E6E 0%, #ec4899 100%); padding: 32px; border-radius: 12px 12px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; text-align: center;">
                        🆘 Support Request
                      </h1>
                      <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; text-align: center;">
                        New support ticket from ${companyName}
                      </p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 32px;">
                      
                      <!-- Subject -->
                      <div style="margin-bottom: 24px; padding: 16px; background: linear-gradient(135deg, #EF2E6E10 0%, #ec489910 100%); border-left: 4px solid #EF2E6E; border-radius: 8px;">
                        <h2 style="margin: 0 0 4px 0; color: #111827; font-size: 18px; font-weight: 600;">
                          ${subject}
                        </h2>
                      </div>

                      <!-- Message -->
                      <div style="margin-bottom: 32px;">
                        <h3 style="margin: 0 0 12px 0; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                          Message
                        </h3>
                        <div style="padding: 16px; background: #f9fafb; border-radius: 8px; color: #111827; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
${message}
                        </div>
                      </div>

                      <!-- User Profile -->
                      <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
                        <h3 style="margin: 0 0 16px 0; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                          User Profile
                        </h3>
                        
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td width="140" style="color: #6b7280; font-size: 14px; padding: 8px 0;">User ID</td>
                            <td style="color: #111827; font-size: 14px; font-weight: 600; padding: 8px 0; font-family: monospace; font-size: 12px;">
                              ${userId}
                            </td>
                          </tr>
                          <tr>
                            <td width="140" style="color: #6b7280; font-size: 14px; padding: 8px 0;">Email</td>
                            <td style="color: #111827; font-size: 14px; font-weight: 600; padding: 8px 0;">
                              <a href="mailto:${userEmail}" style="color: #EF2E6E; text-decoration: none;">
                                ${userEmail}
                              </a>
                            </td>
                          </tr>
                          <tr>
                            <td width="140" style="color: #6b7280; font-size: 14px; padding: 8px 0;">Company</td>
                            <td style="color: #111827; font-size: 14px; font-weight: 600; padding: 8px 0;">
                              ${companyName}
                            </td>
                          </tr>
                          <tr>
                            <td width="140" style="color: #6b7280; font-size: 14px; padding: 8px 0;">Website</td>
                            <td style="color: #111827; font-size: 14px; font-weight: 600; padding: 8px 0;">
                              ${websiteUrl !== "No website" ? `<a href="${websiteUrl}" style="color: #EF2E6E; text-decoration: none;">${websiteUrl}</a>` : websiteUrl}
                            </td>
                          </tr>
                          <tr>
                            <td width="140" style="color: #6b7280; font-size: 14px; padding: 8px 0;">User Type</td>
                            <td style="padding: 8px 0;">
                              <span style="display: inline-block; background: linear-gradient(135deg, #EF2E6E 0%, #ec4899 100%); color: #ffffff; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px;">
                                ${userType.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                          ${userType === 'agency' ? `
                          <tr>
                            <td width="140" style="color: #6b7280; font-size: 14px; padding: 8px 0;">Agency ID</td>
                            <td style="color: #111827; font-size: 14px; font-weight: 600; padding: 8px 0; font-family: monospace; font-size: 12px;">
                              ${agencyId}
                            </td>
                          </tr>
                          ` : ''}
                        </table>
                      </div>

                      <!-- Additional Profile Data -->
                      ${profile && (profile.ad_spend || profile.monthly_revenue || profile.product_description) ? `
                      <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 24px;">
                        <h3 style="margin: 0 0 16px 0; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                          Business Details
                        </h3>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          ${profile.monthly_revenue ? `
                          <tr>
                            <td width="140" style="color: #6b7280; font-size: 14px; padding: 8px 0;">Monthly Revenue</td>
                            <td style="color: #111827; font-size: 14px; font-weight: 600; padding: 8px 0;">
                              ${profile.monthly_revenue}
                            </td>
                          </tr>
                          ` : ''}
                          ${profile.ad_spend ? `
                          <tr>
                            <td width="140" style="color: #6b7280; font-size: 14px; padding: 8px 0;">Ad Spend</td>
                            <td style="color: #111827; font-size: 14px; font-weight: 600; padding: 8px 0;">
                              ${profile.ad_spend}
                            </td>
                          </tr>
                          ` : ''}
                          ${profile.ad_platforms && profile.ad_platforms.length > 0 ? `
                          <tr>
                            <td width="140" style="color: #6b7280; font-size: 14px; padding: 8px 0; vertical-align: top;">Platforms</td>
                            <td style="color: #111827; font-size: 14px; font-weight: 600; padding: 8px 0;">
                              ${profile.ad_platforms.join(', ')}
                            </td>
                          </tr>
                          ` : ''}
                          ${profile.product_description ? `
                          <tr>
                            <td width="140" style="color: #6b7280; font-size: 14px; padding: 8px 0; vertical-align: top;">Product</td>
                            <td style="color: #111827; font-size: 14px; padding: 8px 0; line-height: 1.5;">
                              ${profile.product_description}
                            </td>
                          </tr>
                          ` : ''}
                        </table>
                      </div>
                      ` : ''}

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; background: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                        Received via ScalingAD Support Form • <a href="https://scalingad.com" style="color: #EF2E6E; text-decoration: none;">scalingad.com</a>
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ScalingAD Support <noreply@updates.scalingad.com>",
        to: ["info@scalingad.com"],
        reply_to: userEmail,
        subject: `Support: ${subject}`,
        html: htmlContent,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", resendData);
      throw new Error(`Failed to send email: ${JSON.stringify(resendData)}`);
    }

    return new Response(
      JSON.stringify({ success: true, emailId: resendData.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
