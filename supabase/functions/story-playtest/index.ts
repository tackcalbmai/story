import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const EVENT_NAMES = new Set([
  "phase",
  "start",
  "recorder_sequence_complete",
  "order_attempt",
  "first_choice",
  "sound_toggle",
]);

const SCENES = new Set([
  "gate", "intro", "ticket", "bag-place", "bag-move", "led",
  "recorder-controls", "evidence", "order", "recording", "voice-match", "end",
]);

function isAllowedOrigin(origin: string | null) {
  if (!origin) return false;
  return origin === "https://komnata-zero.victor-lev.chatgpt.site"
    || /^https:\/\/story(?:-[a-z0-9-]+)?\.vercel\.app$/.test(origin);
}

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin) ? origin! : "null",
    "Access-Control-Allow-Headers": "content-type, x-story-client",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

function sanitizeDetail(eventName: string, input: unknown) {
  const detail = input && typeof input === "object" && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {};
  if (eventName === "start" || eventName === "sound_toggle") return { sound: detail.sound === true };
  if (eventName === "order_attempt") return { correct: detail.correct === true };
  if (eventName === "first_choice") return { choice: detail.choice === "keep" ? "keep" : "hide" };
  if (eventName === "phase" && typeof detail.phase === "string" && SCENES.has(detail.phase)) {
    return { phase: detail.phase };
  }
  return {};
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: isAllowedOrigin(origin) ? 204 : 403,
      headers: corsHeaders(origin),
    });
  }

  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, origin);
  if (!isAllowedOrigin(origin)) return json({ error: "origin_not_allowed" }, 403, origin);
  if (request.headers.get("x-story-client") !== "between-stations-workprint-01") {
    return json({ error: "client_not_allowed" }, 403, origin);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400, origin);
  }

  const sessionId = typeof payload.session_id === "string" ? payload.session_id : "";
  const eventName = typeof payload.event_name === "string" ? payload.event_name : "";
  const scene = typeof payload.scene === "string" ? payload.scene : "";

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
    return json({ error: "invalid_session" }, 400, origin);
  }
  if (!EVENT_NAMES.has(eventName) || !SCENES.has(scene)) {
    return json({ error: "invalid_event" }, 400, origin);
  }

  const projectUrl = Deno.env.get("SUPABASE_URL");
  const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
  const serviceKey = secretKeysRaw
    ? JSON.parse(secretKeysRaw).default
    : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!projectUrl || !serviceKey) return json({ error: "server_configuration" }, 500, origin);

  const supabase = createClient(projectUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count, error: countError } = await supabase
    .from("story_playtest_events")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .gte("created_at", oneMinuteAgo);

  if (countError) return json({ error: "rate_check_failed" }, 500, origin);
  if ((count ?? 0) >= 40) return json({ error: "rate_limited" }, 429, origin);

  const { error } = await supabase.from("story_playtest_events").insert({
    session_id: sessionId,
    event_name: eventName,
    scene,
    detail: sanitizeDetail(eventName, payload.detail),
    version: "workprint-01",
  });

  if (error) return json({ error: "write_failed" }, 500, origin);
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
});
