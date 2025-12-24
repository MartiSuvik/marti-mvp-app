import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Zoom Server-to-Server OAuth credentials
const ZOOM_ACCOUNT_ID = Deno.env.get("ZOOM_ACCOUNT_ID") || "";
const ZOOM_CLIENT_ID = Deno.env.get("ZOOM_CLIENT_ID") || "";
const ZOOM_CLIENT_SECRET = Deno.env.get("ZOOM_CLIENT_SECRET") || "";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface ZoomMeetingResponse {
  id: number;
  join_url: string;
  start_url: string;
  topic: string;
  password?: string;
}

/**
 * Get Zoom OAuth access token using Server-to-Server OAuth
 */
async function getZoomAccessToken(): Promise<string> {
  const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`;

  const credentials = btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`);

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Zoom token error:", errorText);
    throw new Error(`Failed to get Zoom access token: ${response.status}`);
  }

  const data: ZoomTokenResponse = await response.json();
  return data.access_token;
}

/**
 * Create a Zoom meeting
 */
async function createZoomMeeting(
  accessToken: string,
  topic: string
): Promise<ZoomMeetingResponse> {
  // Generate a random 6-digit passcode
  const passcode = Math.random().toString().slice(2, 8);

  const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic,
      type: 2, // SCHEDULED meeting (required for hostless join)
      start_time: new Date(Date.now() + 60_000).toISOString(), // 1 min in future
      duration: 60, // logical duration, Zoom may enforce limits
      password: passcode,
      settings: {
        join_before_host: true,
        waiting_room: false,
        host_video: false,
        participant_video: true,
        audio: "both",
        mute_upon_entry: false,
        approval_type: 2, // No registration
        meeting_authentication: false,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Zoom meeting creation error:", errorText);
    throw new Error(`Failed to create Zoom meeting: ${response.status}`);
  }

  return await response.json();
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with user's auth
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { conversationId, initiatorName } = await req.json();

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: "conversationId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify user has access to this conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id, business_id, agency_id")
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      return new Response(
        JSON.stringify({ error: "Conversation not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check credentials are configured
    if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
      console.error("Zoom credentials not configured");
      return new Response(
        JSON.stringify({ error: "Zoom service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get Zoom access token
    const accessToken = await getZoomAccessToken();

    // Create meeting
    const meetingTopic = `ScalingAd Call${initiatorName ? ` - ${initiatorName}` : ""}`;
    const meeting = await createZoomMeeting(accessToken, meetingTopic);

    console.log("Zoom meeting created:", meeting.id);

    // Return Zoom's official join_url - respects all meeting settings
    // (join_before_host, waiting_room, etc.)
    return new Response(
      JSON.stringify({
        success: true,
        joinUrl: meeting.join_url,
        meetingId: meeting.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error creating Zoom meeting:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Failed to create meeting",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
