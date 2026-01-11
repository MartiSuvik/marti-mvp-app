import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  jobId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { jobId }: NotifyRequest = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(`
        *,
        agency:agencies(name, contact_email),
        business:user_profiles!jobs_business_id_fkey(company_name)
      `)
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      throw new Error(`Job not found: ${jobError?.message}`);
    }

    const agencyEmail = job.agency.contact_email || "info@scalingad.com";
    const agencyName = job.agency.name;
    const businessName = job.business.company_name || "The client";
    const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: job.currency }).format(job.amount);

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Funded - Start Work</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">ScalingAD</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Agency Matching Platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 8px 0; color: #111827; font-size: 24px; font-weight: 700;">💰 Payment Received - Start Work!</h2>
              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                Great news! <strong>${businessName}</strong> has funded the project. You can now begin work!
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #d1fae5; border: 2px solid #10b981; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #047857; font-size: 14px; font-weight: 600; text-transform: uppercase;">Project Funded</p>
                    <p style="margin: 0; color: #065f46; font-size: 32px; font-weight: 700;">${amount}</p>
                    <p style="margin: 8px 0 0 0; color: #059669; font-size: 12px;">Secured by ScalingAD</p>
                  </td>
                </tr>
              </table>
              
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">${job.title}</h3>
                <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">${job.description || 'No description'}</p>
                
                ${job.has_milestones ? `
                <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 16px;">
                  <p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.6;">
                    <strong>💡 Milestone Project:</strong> Complete and submit each milestone for approval. Payments are released as you progress.
                  </p>
                </div>
                ` : ''}
              </div>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px 0;">
                    <a href="https://scalingad.com/agency/jobs/${jobId}" 
                       style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
                      Start Working →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6; text-align: center;">
                Funds are held securely. Once ${businessName} approves your work, payment will be released to your account.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} ScalingAD. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ScalingAD <noreply@updates.scalingad.com>",
        to: agencyEmail,
        subject: `💰 ${businessName} funded ${job.title} - Start work now!`,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", resendData);
      throw new Error(`Failed to send email: ${JSON.stringify(resendData)}`);
    }

    return new Response(
      JSON.stringify({ success: true, emailId: resendData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error in notify-job-funded:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
