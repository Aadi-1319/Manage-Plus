import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1️⃣ Check auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth header" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // 2️⃣ User client (for auth verification)
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // 3️⃣ Check role in owner table
    const { data: owner, error: ownerError } = await userClient
      .from("owner")
      .select("*")
      .eq("owner_id", user.id) // replace with your PK column
      .single();

    if (ownerError || !owner) {
      return new Response(JSON.stringify({ error: "User not allowed" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // 4️⃣ Admin client (service role)
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 5️⃣ Parse request body
    const body = await req.json();
    const { email, full_name, company_id ,phone,aadhar,pan,address,owner_id} = body;

    if (!email || !full_name || !company_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 6️⃣ Invite supervisor
   const { data: invite, error: inviteError } =
  await adminClient.auth.admin.inviteUserByEmail(normalizedEmail, {
    redirectTo: "http://localhost:8080/setup-account"
  });


    if (inviteError) {
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Use invite.user.id if available, otherwise fallback to null
    const supervisorId = invite.user?.id || null;

    // 7️⃣ Insert into supervisor table
    const { error: insertError } = await adminClient.from("supervisor").insert({
      supervisor_id: supervisorId,
      email: normalizedEmail,
      full_name : full_name,
      company_id : company_id,
      phone : phone,
      aadhar: aadhar,
      pan: pan,
      address: address,
      owner_id : owner_id
    });

    if (insertError) {
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});