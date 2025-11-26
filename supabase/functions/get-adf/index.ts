// @ts-nocheck
// supabase/functions/get-adf/index.ts
// Resolve ADF IDs for the authenticated user by:
// 1) Fetching Dendreo participant via email (participants.php?email=...)
// 2) Fetching laps by participant (laps.php?id_participant=...)
// Returns a list of unique ADF IDs (id_action_de_formation)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { normalizeToArray, readJsonSafe as sharedReadJsonSafe } from "../_shared/dendreo-utils.ts";

const ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "https://yourapp.com"]; // adjust

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

// Open Deno KV for caching
let kv: Deno.Kv | null = null;
try {
  kv = await Deno.openKv();
  console.log("[get-adf] Deno KV initialized successfully");
} catch (e) {
  console.warn("[get-adf] Failed to initialize Deno KV:", e);
  // Continue without caching
}
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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

    // Try to get from cache
    const cacheKey = ["get-adf", email];
    if (kv) {
      try {
        const cached = await kv.get(cacheKey);
        if (cached.value && typeof cached.value === "object") {
          console.log(`[get-adf] ✅ Cache HIT for ${email}`);
          return new Response(JSON.stringify(cached.value), {
            status: 200,
            headers: { ...headers, "Content-Type": "application/json", "X-Cache": "HIT" },
          });
        }
      } catch (e) {
        console.warn("[get-adf] Cache read error:", e);
        // Continue without cache
      }
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
    
    // Normalize to array - handles both single participant object and array
    const participantsArray = normalizeToArray(participantsData, {
      idProperty: 'id_participant',
      wrapperProperties: ['data', 'participants']
    });
    
    let participantId: string | null = null;
    let extranetCode: string | null = null;
    
    if (participantsArray.length > 0) {
      const first = participantsArray[0] as Record<string, unknown>;
      const raw = first?.["id_participant"] as unknown;
      if (typeof raw === "string" && raw.trim()) participantId = raw.trim();
      if (typeof raw === "number" && Number.isFinite(raw)) participantId = String(raw);
      const codeRaw = first?.["extranet_code"] as unknown;
      if (typeof codeRaw === "string" && codeRaw.trim()) extranetCode = codeRaw.trim();
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
    lapsUrl.searchParams.set("include", "action_de_formation");
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
    
    // Normalize laps data to array - handles single lap or multiple laps
    const lapsArray = normalizeToArray(lapsData, {
      idProperty: 'id_lap',
      wrapperProperties: ['data', 'laps']
    });
    
    const adfIdSet = new Set<string>();
    const lapIdSet = new Set<string>();
    const adfToLapIds = new Map<string, Set<string>>();
    const adfTitles = new Map<string, string>();
    const adfResponsables = new Map<string, string>();

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
      const adfTitleRaw = formation ? (formation as Record<string, unknown>)["intitule"] as unknown : undefined;
      const idResponsableRaw = formation ? (formation as Record<string, unknown>)["id_responsable"] as unknown : undefined;
      const adfTitle = typeof adfTitleRaw === "string" && adfTitleRaw.trim() ? adfTitleRaw.trim() : null;
      const lapId = normalizeId((obj as Record<string, unknown>)["id_lap"]) || normalizeId((obj as Record<string, unknown>)["id"]) || null;
      return { adfId: topLevelId || nestedId, categoryId, lapId, adfTitle };
    };

    const considerItem = (obj: Record<string, unknown>) => {
      const { adfId, categoryId, lapId, adfTitle } = extractAdfFromItem(obj);
      if (!adfId) return;
      if (categoryId === "6") {
        adfIdSet.add(adfId);
        if (lapId) {
          lapIdSet.add(lapId);
          if (!adfToLapIds.has(adfId)) adfToLapIds.set(adfId, new Set<string>());
          adfToLapIds.get(adfId)!.add(lapId);
        }
        if (adfTitle && !adfTitles.has(adfId)) adfTitles.set(adfId, adfTitle);
        const idRes = typeof idResponsableRaw === "string" && idResponsableRaw.trim() ? idResponsableRaw.trim() : (typeof idResponsableRaw === "number" && Number.isFinite(idResponsableRaw) ? String(idResponsableRaw) : null);
        if (idRes && !adfResponsables.has(adfId)) adfResponsables.set(adfId, idRes);
      }
    };

    // Process all laps using the normalized array
    for (const item of lapsArray) {
      if (item && typeof item === "object") {
        considerItem(item as Record<string, unknown>);
      }
    }

    const adf_ids = Array.from(adfIdSet);
    const lap_ids = Array.from(lapIdSet);
    const adf_to_lap_ids = Object.fromEntries(Array.from(adfToLapIds.entries()).map(([k, v]) => [k, Array.from(v.values())]));
    const adf_titles = Object.fromEntries(Array.from(adfTitles.entries()));
    // Ensure id_responsable is filled by querying actions_de_formation when missing
    if (adf_ids.length > 0) {
      const fetchOne = async (adfId: string) => {
        // Skip if we already have a responsable for this ADF
        if (adfResponsables.has(adfId)) return null;
        const u = new URL("https://pro.dendreo.com/competences_et_metiers/api/actions_de_formation.php");
        u.searchParams.set("id", adfId);
        u.searchParams.set("key", apiKey);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15_000);
        try {
          const res = await fetch(u.toString(), { method: "GET", signal: controller.signal });
          const body = await readJsonSafe(res);
          if (!res.ok) return null;
          const raw = body && typeof body === "object" ? (body as Record<string, unknown>)["id_responsable"] as unknown : null;
          const idRes = typeof raw === "string" && raw.trim() ? raw.trim() : (typeof raw === "number" && Number.isFinite(raw) ? String(raw) : null);
          if (idRes) adfResponsables.set(adfId, idRes);
          return null;
        } catch (_) {
          return null;
        } finally {
          clearTimeout(timeout);
        }
      };
      await Promise.all(adf_ids.map(fetchOne));
    }
    const adf_responsables = Object.fromEntries(Array.from(adfResponsables.entries()));
    const extranet_code_numeric = extranetCode ? extranetCode.replace(/\D/g, "") : null;
    
    const responseData = { 
      email, 
      id_participant: participantId, 
      adf_ids, 
      lap_ids, 
      adf_to_lap_ids, 
      adf_titles, 
      adf_responsables, 
      extranet_code: extranetCode, 
      extranet_code_numeric 
    };
    
    // Store in cache
    if (kv) {
      try {
        await kv.set(cacheKey, responseData, { expireIn: CACHE_TTL_MS });
        console.log(`[get-adf] 💾 Cached for ${email} (TTL: ${CACHE_TTL_MS}ms)`);
      } catch (e) {
        console.warn("[get-adf] Cache write error:", e);
        // Continue without caching
      }
    }
    
    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...headers, "Content-Type": "application/json", "X-Cache": "MISS" } }
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

