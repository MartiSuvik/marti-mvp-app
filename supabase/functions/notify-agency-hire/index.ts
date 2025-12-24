import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyHireRequest {
  dealId: string;
  agencyId: string;
  businessUserId: string;
  conversationId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { dealId, agencyId, businessUserId, conversationId }: NotifyHireRequest = await req.json();

    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch agency details
    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .select("id, name, contact_email")
      .eq("id", agencyId)
      .single();

    if (agencyError || !agency) {
      throw new Error(`Agency not found: ${agencyError?.message}`);
    }

    // Fetch business user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("company_name, ad_spend, ad_platforms, monthly_revenue")
      .eq("user_id", businessUserId)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
    }

    const businessName = profile?.company_name || "A business";
    const adSpend = profile?.ad_spend || "Not specified";
    const platforms = profile?.ad_platforms?.join(", ") || "Not specified";
    const monthlyRevenue = profile?.monthly_revenue || "Not specified";

    // Agency email - fallback to info@scalingad.com if not set
    const agencyEmail = agency.contact_email || "info@scalingad.com";

    // Build the email HTML with ScalingAD branding
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Client Wants to Hire You - ScalingAD</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #EF2E6E 0%, #ec4899 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                ScalingAD
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                Agency Matching Platform
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Greeting -->
              <h2 style="margin: 0 0 8px 0; color: #111827; font-size: 24px; font-weight: 700;">
                🎉 A Client Wants to Hire You!
              </h2>
              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                Great news! <strong>${businessName}</strong> is interested in working with <strong>${agency.name}</strong> and has started a conversation.
              </p>
              
              <!-- Business Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Client Details
                    </h3>
                    
                    <!-- Business Name -->
                    <table width="100%" style="margin-bottom: 12px;">
                      <tr>
                        <td width="140" style="color: #6b7280; font-size: 14px; padding: 8px 0;">Company</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600; padding: 8px 0;">${businessName}</td>
                      </tr>
                    </table>
                    
                    <!-- Monthly Revenue -->
                    <table width="100%" style="margin-bottom: 12px;">
                      <tr>
                        <td width="140" style="color: #6b7280; font-size: 14px; padding: 8px 0;">Monthly Revenue</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600; padding: 8px 0;">${monthlyRevenue}</td>
                      </tr>
                    </table>
                    
                    <!-- Ad Spend -->
                    <table width="100%" style="margin-bottom: 12px;">
                      <tr>
                        <td width="140" style="color: #6b7280; font-size: 14px; padding: 8px 0;">Ad Spend</td>
                        <td>
                          <span style="display: inline-block; background: linear-gradient(135deg, #EF2E6E 0%, #ec4899 100%); color: #ffffff; font-size: 13px; font-weight: 600; padding: 4px 12px; border-radius: 20px;">
                            ${adSpend}
                          </span>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Platforms -->
                    <table width="100%" style="margin-bottom: 0;">
                      <tr>
                        <td width="140" style="color: #6b7280; font-size: 14px; padding: 8px 0; vertical-align: top;">Platforms</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600; padding: 8px 0;">${platforms}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px 0;">
                    <a href="https://scalingad.com/agency/messages/${conversationId}" 
                       style="display: inline-block; background: linear-gradient(135deg, #EF2E6E 0%, #ec4899 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(239, 46, 110, 0.4);">
                      View Conversation →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Note -->
              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                Log in to your ScalingAD agency dashboard to respond to this client. Quick responses lead to more successful partnerships!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} ScalingAD. All rights reserved.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                You're receiving this because you're a verified agency on ScalingAD.
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
        from: "ScalingAD <notifications@scalingad.com>",
        to: agencyEmail,
        subject: `🎯 ${businessName} wants to hire ${agency.name}!`,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", resendData);
      throw new Error(`Failed to send email: ${JSON.stringify(resendData)}`);
    }

    console.log("Hire notification email sent successfully:", resendData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Hire notification sent",
        emailId: resendData.id 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error in notify-agency-hire:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
