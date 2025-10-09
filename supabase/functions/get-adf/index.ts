// @ts-nocheck
// supabase/functions/get-adf/index.ts
// Resolve ADF IDs for the authenticated user by:
// 1) Fetching Dendreo participant via email (participants.php?email=...)
// 2) Fetching laps by participant (laps.php?id_participant=...)
// Returns a list of unique ADF IDs (id_action_de_formation)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:5173", "https://yourapp.com"]; // adjust

function corsHeaders(origin: string | null) {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin, Access-Control-Request-Method, Access-Control-Request-Headers",
  };
}

// Helper to read JSON body safely depending on content-type
async function readJsonSafe(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  if (isJson) return await res.json().catch(() => null);
  try {
    const txt = await res.text();
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  // CORS preflight
  if (req.method === "OPTIONS") {
    const requested = (req.headers.get("access-control-request-headers") || "").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
    const defaultAllowed = (headers["Access-Control-Allow-Headers"] || "").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
    const merged = Array.from(new Set([...defaultAllowed, ...requested])).join(", ");
    const preflightHeaders = {
      ...headers,
      "Access-Control-Allow-Headers": merged || headers["Access-Control-Allow-Headers"],
      "Access-Control-Max-Age": "86400",
    } as Record<string, string>;
    return new Response(null, { headers: preflightHeaders, status: 200 });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const emailFromQuery = url.searchParams.get("email");

    // derive user email from Authorization header if available
    let userEmail: string | null = null;
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const jwt = authHeader.slice("Bearer ".length).trim();
      try {
        const parts = jwt.split(".");
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload && typeof payload === "object") {
            userEmail = payload["email"] ?? payload["user_metadata"]?.["email"] ?? null;
          }
        }
      } catch (_) {
        // ignore jwt decode issues, we'll fallback
      }
    }

    const email = (userEmail || emailFromQuery || "").trim();
    if (!email) {
      return new Response(JSON.stringify({ error: "Missing user email (auth or ?email=)" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // Prefer env var; fallback to constant provided in request if env missing
    const envKey = Deno.env.get("DENDREO_API_KEY");
    const apiKey = envKey && envKey.trim().length > 0 ? envKey : "";

    // 1) participants lookup by email
    const participantsUrl = new URL("https://pro.dendreo.com/competences_et_metiers/api/participants.php");
    participantsUrl.searchParams.set("email", email);
    participantsUrl.searchParams.set("include", "participations");
    participantsUrl.searchParams.set("key", apiKey);

    const ctrl1 = new AbortController();
    const t1 = setTimeout(() => ctrl1.abort(), 15_000);
    const resParticipants = await fetch(participantsUrl.toString(), { method: "GET", signal: ctrl1.signal }).finally(() => clearTimeout(t1));
    if (!resParticipants.ok) {
      const details = await readJsonSafe(resParticipants);
      return new Response(
        JSON.stringify({ error: "Dendreo API error (participants)", status: resParticipants.status, details }),
        { status: resParticipants.status, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    const participantsData = await readJsonSafe(resParticipants);
    let participantId: string | null = null;
    if (Array.isArray(participantsData) && participantsData.length > 0) {
      const first = participantsData[0] as Record<string, unknown>;
      const raw = first?.["id_participant"] as unknown;
      if (typeof raw === "string" && raw.trim()) participantId = raw.trim();
      if (typeof raw === "number" && Number.isFinite(raw)) participantId = String(raw);
    } else if (participantsData && typeof participantsData === "object") {
      const raw = (participantsData as Record<string, unknown>)["id_participant"] as unknown;
      if (typeof raw === "string" && raw.trim()) participantId = raw.trim();
      if (typeof raw === "number" && Number.isFinite(raw)) participantId = String(raw);
    }

    if (!participantId) {
      return new Response(JSON.stringify({ error: "Participant not found for email", email }), {
        status: 404,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // 2) laps by participant
    const lapsUrl = new URL("https://pro.dendreo.com/competences_et_metiers/api/laps.php");
    lapsUrl.searchParams.set("id_participant", participantId);
    lapsUrl.searchParams.set("key", apiKey);

    const ctrl2 = new AbortController();
    const t2 = setTimeout(() => ctrl2.abort(), 15_000);
    const resLaps = await fetch(lapsUrl.toString(), { method: "GET", signal: ctrl2.signal }).finally(() => clearTimeout(t2));
    if (!resLaps.ok) {
      const details = await readJsonSafe(resLaps);
      return new Response(
        JSON.stringify({ error: "Dendreo API error (laps)", status: resLaps.status, details }),
        { status: resLaps.status, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    const lapsData = await readJsonSafe(resLaps);
    const adfIdSet = new Set<string>();

    const normalizeId = (value: unknown): string | null => {
      if (typeof value === "string" && value.trim()) return value.trim();
      if (typeof value === "number" && Number.isFinite(value)) return String(value);
      return null;
    };

    const extractAdfFromItem = (obj: Record<string, unknown>) => {
      const formation = (obj["formation"] as Record<string, unknown> | undefined) || undefined;
      const topLevelId = normalizeId(obj["id_action_de_formation"]);
      const nestedId = formation ? normalizeId(formation["id_action_de_formation"]) : null;
      const categoryId = formation ? normalizeId(formation["categorie_module_id"]) : null;
      return { adfId: topLevelId || nestedId, categoryId };
    };

    const considerItem = (obj: Record<string, unknown>) => {
      const { adfId, categoryId } = extractAdfFromItem(obj);
      if (!adfId) return;
      if (categoryId === "6") adfIdSet.add(adfId);
    };

    if (Array.isArray(lapsData)) {
      for (const item of lapsData) {
        if (item && typeof item === "object") considerItem(item as Record<string, unknown>);
      }
    } else if (lapsData && typeof lapsData === "object") {
      considerItem(lapsData as Record<string, unknown>);
      const items = (lapsData as Record<string, unknown>)["laps"] as unknown;
      if (Array.isArray(items)) {
        for (const it of items) if (it && typeof it === "object") considerItem(it as Record<string, unknown>);
      }
    }

    const adf_ids = Array.from(adfIdSet);
    return new Response(
      JSON.stringify({ email, id_participant: participantId, adf_ids }),
      { status: 200, headers: { ...headers, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error && err.name === "AbortError"
      ? "Upstream request timed out"
      : (err as Error)?.message ?? "Unexpected error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 502,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  }
});

