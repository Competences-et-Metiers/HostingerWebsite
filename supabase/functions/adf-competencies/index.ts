// @ts-nocheck
// supabase/functions/adf-competencies/index.ts
// Resolve participant for current user and return competencies grouped by ADF with evaluations info

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
  } as Record<string, string>;
}

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

function normalizeId(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

type EvalOut = {
  evaluation_name: string | null;
  validated: boolean;
  validated_label: string;
  appreciation: string | null;
};

type Group = { adf_id: string; title: string | null; evaluations: EvalOut[] };

function formatEvaluation(ev: Record<string, unknown>): EvalOut | null {
  if (!ev || typeof ev !== "object") return null;
  const nameCandidates = [
    ev["evaluation_name"],
    ev["competence_name"],
    ev["competency_name"],
    ev["competence_label"],
    ev["title"],
    ev["label"],
  ];
  let evaluation_name: string | null = null;
  for (const candidate of nameCandidates) {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed) {
        evaluation_name = trimmed;
        break;
      }
    }
  }

  const validatedRaw = ev["validated"] ?? ev["is_validated"] ?? ev["validation"] ?? ev["status"];
  const isValidated =
    validatedRaw === 1 ||
    validatedRaw === "1" ||
    validatedRaw === true ||
    validatedRaw === "true" ||
    validatedRaw === "validated";

  const isPending =
    validatedRaw === null ||
    validatedRaw === undefined ||
    (typeof validatedRaw === "string" && validatedRaw.trim() === "") ||
    validatedRaw === "pending";

  const appreciationCandidates = [
    ev["appreciation"],
    ev["comment"],
    ev["comments"],
    ev["commentaire"],
  ];
  let appreciation: string | null = null;
  for (const candidate of appreciationCandidates) {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed) {
        appreciation = trimmed;
        break;
      }
    }
  }

  return {
    evaluation_name,
    validated: isValidated,
    validated_label: isPending ? "En cours" : (isValidated ? "Validé" : "Non validé"),
    appreciation,
  };
}

function collectEvaluationsByAdf(payload: unknown): Map<string, EvalOut[]> {
  const byAdf = new Map<string, EvalOut[]>();
  const dedupe = new Map<string, Set<string>>();
  const stack: Array<{ node: unknown; adfId: string | null }> = [{ node: payload, adfId: null }];

  while (stack.length > 0) {
    const { node, adfId } = stack.pop()!;
    if (!node) continue;

    if (Array.isArray(node)) {
      for (const item of node) {
        stack.push({ node: item, adfId });
      }
      continue;
    }

    if (typeof node !== "object") continue;
    const record = node as Record<string, unknown>;

    const explicitAdfId =
      normalizeId(record["id_action_de_formation"]) ??
      normalizeId(record["adf_id"]) ??
      normalizeId(record["idActionDeFormation"]) ??
      normalizeId(record["action_de_formation_id"]);

    const currentAdfId = explicitAdfId || adfId;

    const evaluations = record["evaluations"];
    if (currentAdfId && Array.isArray(evaluations)) {
      let list = byAdf.get(currentAdfId);
      if (!list) {
        list = [];
        byAdf.set(currentAdfId, list);
      }

      let seen = dedupe.get(currentAdfId);
      if (!seen) {
        seen = new Set<string>();
        dedupe.set(currentAdfId, seen);
      }

      for (const ev of evaluations) {
        if (!ev || typeof ev !== "object") continue;
        const evRecord = ev as Record<string, unknown>;
        const identifier =
          normalizeId(evRecord["id_evaluation"]) ??
          normalizeId(evRecord["evaluation_set_id"]) ??
          (typeof evRecord["evaluation_name"] === "string" ? evRecord["evaluation_name"] : null);
        if (identifier && seen.has(identifier)) continue;
        const formatted = formatEvaluation(evRecord);
        if (formatted) {
          list.push(formatted);
          if (identifier) seen.add(identifier);
        }
      }
    }

    for (const [key, value] of Object.entries(record)) {
      if (key === "evaluations") continue;
      if (value && typeof value === "object") {
        stack.push({ node: value, adfId: currentAdfId });
      }
    }
  }

  return byAdf;
}

// Open Deno KV for caching
const kv = await Deno.openKv();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  try {
    // Resolve user email from Authorization: Bearer <jwt>
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
        // ignore
      }
    }

    const url = new URL(req.url);
    const emailFromQuery = url.searchParams.get("email");
    const email = (userEmail || emailFromQuery || "").trim();
    if (!email) {
      return new Response(JSON.stringify({ error: "Missing user email (auth or ?email=)" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // Try to get from cache
    const cacheKey = ["adf-competencies", email];
    try {
      const cached = await kv.get(cacheKey);
      if (cached.value && typeof cached.value === "object") {
        console.log(`[adf-competencies] ✅ Cache HIT for ${email}`);
        return new Response(JSON.stringify(cached.value), {
          status: 200,
          headers: { ...headers, "Content-Type": "application/json", "X-Cache": "HIT" },
        });
      }
    } catch (e) {
      console.warn("[adf-competencies] Cache read error:", e);
      // Continue without cache
    }

    let participantId: string | null = null;
    let allowedAdfIds: string[] | null = null;
    const adfTitlesFromFilter = new Map<string, string>();

    try {
      const getAdfUrl = new URL(req.url);
      const segments = getAdfUrl.pathname.split("/");
      if (segments.length > 0) {
        segments[segments.length - 1] = "get-adf";
        getAdfUrl.pathname = segments.join("/");
      }
      getAdfUrl.search = "";
      getAdfUrl.searchParams.set("email", email);
      
      // Copy all necessary headers from the original request
      const getAdfHeaders: Record<string, string> = {};
      const apikeyHeader = req.headers.get("apikey");
      if (apikeyHeader) getAdfHeaders["apikey"] = apikeyHeader;
      if (authHeader) getAdfHeaders["Authorization"] = authHeader;
      
      const resGetAdf = await fetch(getAdfUrl.toString(), {
        method: "GET",
        headers: getAdfHeaders,
      });
      if (resGetAdf.ok) {
        const body = await readJsonSafe(resGetAdf);
        if (body && typeof body === "object") {
          const obj = body as Record<string, unknown>;
          const pid = normalizeId(obj["id_participant"]);
          if (pid) participantId = pid;
          if (Array.isArray(obj["adf_ids"])) {
            const arr: string[] = [];
            for (const value of obj["adf_ids"] as unknown[]) {
              const id = normalizeId(value);
              if (id) arr.push(id);
            }
            allowedAdfIds = arr;
            console.log(`[adf-competencies] Successfully fetched ${arr.length} ADF IDs from get-adf:`, arr.join(", "));
          }
          const titlesRaw = obj["adf_titles"];
          if (titlesRaw && typeof titlesRaw === "object") {
            for (const [key, value] of Object.entries(titlesRaw as Record<string, unknown>)) {
              const id = normalizeId(key);
              if (!id) continue;
              if (typeof value === "string") {
                const trimmed = value.trim();
                if (trimmed) adfTitlesFromFilter.set(id, trimmed);
              }
            }
          }
        } else {
          console.warn("[adf-competencies] get-adf returned non-object body:", body);
        }
      } else {
        console.warn(`[adf-competencies] get-adf returned status ${resGetAdf.status}`);
      }
    } catch (e) {
      // Log but don't fail - we'll fall back to category filtering
      console.error("[adf-competencies] Failed to call get-adf:", e);
    }

    // If get-adf succeeded and returned ADF IDs, use as strict filter
    // If get-adf failed or returned empty, allowedSet will be null (no filtering by specific IDs)
    const allowedSet = (allowedAdfIds && allowedAdfIds.length > 0) ? new Set(allowedAdfIds) : null;
    
    if (allowedSet) {
      console.log(`[adf-competencies] Filtering enabled: will only return ADFs ${Array.from(allowedSet).join(", ")}`);
    } else {
      console.log("[adf-competencies] No filter applied: will return all category 6 ADFs with evaluations");
    }

    const apiKey = (Deno.env.get("DENDREO_API_KEY") || "").trim();
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server not configured: missing DENDREO_API_KEY" }), {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // If we have a filter from get-adf, use simplified path
    if (allowedSet && participantId) {
      console.log(`[adf-competencies] Using simplified path: fetching evaluations for ${allowedSet.size} ADFs`);
      
      const fetchEvaluationsForAdf = async (adfId: string): Promise<EvalOut[]> => {
        const u = new URL("https://pro.dendreo.com/competences_et_metiers/api/evaluations.php");
        u.searchParams.set("id_action_de_formation", adfId);
        u.searchParams.set("id_participant", participantId);
        u.searchParams.set("key", apiKey);
        console.log(`[adf-competencies] Fetching evaluations for ADF ${adfId}`);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15_000);
        try {
          const res = await fetch(u.toString(), { method: "GET", signal: controller.signal });
          if (!res.ok) {
            console.warn(`[adf-competencies] Failed to fetch evaluations for ADF ${adfId}: ${res.status}`);
            return [];
          }
          const body = await readJsonSafe(res);
          if (body === null || body === undefined) return [];
          const collected = collectEvaluationsByAdf(body);
          const evals = collected.get(adfId) ?? [];
          console.log(`[adf-competencies] Found ${evals.length} evaluations for ADF ${adfId}`);
          return evals;
        } catch (e) {
          console.error(`[adf-competencies] Error fetching evaluations for ADF ${adfId}:`, e);
          return [];
        } finally {
          clearTimeout(timeout);
        }
      };

      // Fetch evaluations for each ADF in parallel
      const adfIds = Array.from(allowedSet);
      const results = await Promise.all(adfIds.map(async (adfId) => {
        const evaluations = await fetchEvaluationsForAdf(adfId);
        return {
          adf_id: adfId,
          title: adfTitlesFromFilter.get(adfId) ?? null,
          evaluations,
        };
      }));

      const adfs = results.sort((a, b) => {
        const titleA = a.title ?? "";
        const titleB = b.title ?? "";
        if (titleA && titleB) return titleA.localeCompare(titleB, "fr", { sensitivity: "base" });
        if (titleA) return -1;
        if (titleB) return 1;
        return a.adf_id.localeCompare(b.adf_id);
      });

      console.log(`[adf-competencies] Returning ${adfs.length} ADFs with evaluations`);
      return new Response(
        JSON.stringify({ email, id_participant: participantId, adfs }),
        { status: 200, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    // Fallback path: when get-adf failed, resolve participant and use category filtering
    if (!participantId) {
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
      if (Array.isArray(participantsData) && participantsData.length > 0) {
        const first = participantsData[0] as Record<string, unknown>;
        const raw = first?.["id_participant"] as unknown;
        const resolved = normalizeId(raw);
        if (resolved) participantId = resolved;
      } else if (participantsData && typeof participantsData === "object") {
        const resolved = normalizeId((participantsData as Record<string, unknown>)["id_participant"]);
        if (resolved) participantId = resolved;
      }

      if (!participantId) {
        return new Response(JSON.stringify({ error: "Participant not found for email", email }), {
          status: 404,
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }
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

    const adfMeta = new Map<string, { title: string | null; categoryId: string | null }>();
    const adfMap = new Map<string, Group>();

    const processItem = (obj: Record<string, unknown>) => {
      if (!obj || typeof obj !== "object") return;
      const formationRaw = obj["formation"];
      const formation = formationRaw && typeof formationRaw === "object" ? formationRaw as Record<string, unknown> : undefined;
      const adfId = normalizeId(obj["id_action_de_formation"]) || (formation ? normalizeId(formation["id_action_de_formation"]) : null);
      if (!adfId) return;
      if (allowedSet && !allowedSet.has(adfId)) return;

      const categoryId = formation ? normalizeId(formation["categorie_module_id"]) : normalizeId(obj["categorie_module_id"]);
      const adfTitleRaw = formation ? formation["intitule"] : obj["intitule"];
      const adfTitle = typeof adfTitleRaw === "string" && adfTitleRaw.trim() ? adfTitleRaw.trim() : null;
      const filteredTitle = adfTitlesFromFilter.get(adfId) || null;

      const existingMeta = adfMeta.get(adfId) || { title: null, categoryId: null };
      if (!existingMeta.categoryId && allowedSet) existingMeta.categoryId = "6";
      if (adfTitle && !existingMeta.title) existingMeta.title = adfTitle;
      if (filteredTitle && !existingMeta.title) existingMeta.title = filteredTitle;
      if (categoryId && !existingMeta.categoryId) existingMeta.categoryId = categoryId;
      adfMeta.set(adfId, existingMeta);

      if (existingMeta.categoryId && existingMeta.categoryId !== "6") return;

      let group = adfMap.get(adfId);
      if (!group) {
        group = { adf_id: adfId, title: existingMeta.title, evaluations: [] };
        adfMap.set(adfId, group);
      } else if (!group.title && existingMeta.title) {
        group.title = existingMeta.title;
      }
    };

    if (Array.isArray(lapsData)) {
      for (const item of lapsData) if (item && typeof item === "object") processItem(item as Record<string, unknown>);
    } else if (lapsData && typeof lapsData === "object") {
      processItem(lapsData as Record<string, unknown>);
      const nested = (lapsData as Record<string, unknown>)["laps"] as unknown;
      if (Array.isArray(nested)) for (const it of nested) if (it && typeof it === "object") processItem(it as Record<string, unknown>);
    }

    // Ensure all allowed ADFs are in the map (if we have a filter)
    if (allowedSet) {
      for (const id of allowedSet.values()) {
        let meta = adfMeta.get(id);
        if (!meta) {
          meta = { title: adfTitlesFromFilter.get(id) ?? null, categoryId: "6" };
          adfMeta.set(id, meta);
        } else {
          if (!meta.categoryId) meta.categoryId = "6";
          if (!meta.title) {
            const title = adfTitlesFromFilter.get(id);
            if (title) meta.title = title;
          }
        }
        const current = adfMap.get(id);
        if (!current) {
          adfMap.set(id, { adf_id: id, title: meta.title, evaluations: [] });
        } else if (!current.title && meta.title) {
          current.title = meta.title;
        }
      }
    }

    const fetchEvaluationsBatch = async (): Promise<Map<string, EvalOut[]>> => {
      const map = new Map<string, EvalOut[]>();
      const evalUrl = new URL("https://pro.dendreo.com/competences_et_metiers/api/evaluations.php");
      evalUrl.searchParams.set("id_participant", participantId!);
      evalUrl.searchParams.set("key", apiKey);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      try {
        const res = await fetch(evalUrl.toString(), { method: "GET", signal: controller.signal });
        if (!res.ok) return map;
        const body = await readJsonSafe(res);
        if (body === null || body === undefined) return map;
        const collected = collectEvaluationsByAdf(body);
        for (const [key, val] of collected.entries()) {
          if (allowedSet && !allowedSet.has(key)) continue;
          map.set(key, val);
        }
      } catch (_) {
        // ignore batch failure, fallback handled later
      } finally {
        clearTimeout(timeout);
      }
      return map;
    };

    const fetchEvaluationsForAdf = async (adfId: string): Promise<EvalOut[]> => {
      const u = new URL("https://pro.dendreo.com/competences_et_metiers/api/evaluations.php");
      u.searchParams.set("id_action_de_formation", adfId);
      u.searchParams.set("id_participant", participantId!);
      u.searchParams.set("key", apiKey);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      try {
        const res = await fetch(u.toString(), { method: "GET", signal: controller.signal });
        if (!res.ok) return [];
        const body = await readJsonSafe(res);
        if (body === null || body === undefined) return [];
        const collected = collectEvaluationsByAdf(body);
        return collected.get(adfId) ?? [];
      } catch (_) {
        return [];
      } finally {
        clearTimeout(timeout);
      }
    };

    let evaluationsByAdf = await fetchEvaluationsBatch();
    // Filter to only allowed ADFs if we have a filter
    if (allowedSet) {
      for (const key of Array.from(evaluationsByAdf.keys())) {
        if (!allowedSet.has(key)) evaluationsByAdf.delete(key);
      }
    }

    const requiredAdfIds = Array.from(adfMap.keys());
    const missingForKnown = requiredAdfIds.filter((id) => !evaluationsByAdf.has(id));
    if (missingForKnown.length > 0) {
      const fallbackResults = await Promise.all(missingForKnown.map(fetchEvaluationsForAdf));
      for (let i = 0; i < missingForKnown.length; i++) {
        const adfId = missingForKnown[i];
        const evals = fallbackResults[i] ?? [];
        if (!evaluationsByAdf.has(adfId) || evals.length > 0) {
          evaluationsByAdf.set(adfId, evals);
        }
      }
    }

    for (const [adfId, group] of adfMap.entries()) {
      const meta = adfMeta.get(adfId);
      if (!group.title && meta?.title) group.title = meta.title;
      group.evaluations = evaluationsByAdf.get(adfId) ?? [];
    }

    for (const [adfId, evaluations] of evaluationsByAdf.entries()) {
      if (adfMap.has(adfId)) continue;
      if (allowedSet && !allowedSet.has(adfId)) continue;
      const meta = adfMeta.get(adfId);
      if (meta && meta.categoryId && meta.categoryId !== "6") continue;
      adfMap.set(adfId, {
        adf_id: adfId,
        title: meta?.title ?? null,
        evaluations,
      });
    }

    const adfs = Array.from(adfMap.values()).map((g) => ({
      ...g,
      evaluations: Array.isArray(g.evaluations) ? g.evaluations : [],
    }));
    adfs.sort((a, b) => {
      const titleA = a.title ?? "";
      const titleB = b.title ?? "";
      if (titleA && titleB) return titleA.localeCompare(titleB, "fr", { sensitivity: "base" });
      if (titleA) return -1;
      if (titleB) return 1;
      return a.adf_id.localeCompare(b.adf_id);
    });

    const responseData = { email, id_participant: participantId, adfs };
    
    // Store in cache
    try {
      await kv.set(cacheKey, responseData, { expireIn: CACHE_TTL_MS });
      console.log(`[adf-competencies] 💾 Cached for ${email} (${adfs.length} ADFs, TTL: ${CACHE_TTL_MS}ms)`);
    } catch (e) {
      console.warn("[adf-competencies] Cache write error:", e);
      // Continue without caching
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
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});
