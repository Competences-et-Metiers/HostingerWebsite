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

    const apiKey = (Deno.env.get("DENDREO_API_KEY") || "").trim();
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server not configured: missing DENDREO_API_KEY" }), {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

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
      participantId = normalizeId(raw);
    } else if (participantsData && typeof participantsData === "object") {
      participantId = normalizeId((participantsData as Record<string, unknown>)["id_participant"]);
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

    type EvalOut = { evaluation_name: string | null; validated: boolean; validated_label: string; appreciation: string | null };
    type Group = { adf_id: string; title: string | null; evaluations: EvalOut[] };

    const adfMap = new Map<string, Group>();

    const processItem = (obj: Record<string, unknown>) => {
      const formation = (obj["formation"] as Record<string, unknown> | undefined) || undefined;
      const adfId = normalizeId(obj["id_action_de_formation"]) || (formation ? normalizeId(formation["id_action_de_formation"]) : null);
      const categoryId = formation ? normalizeId(formation["categorie_module_id"]) : null;
      const adfTitleRaw = formation ? (formation as Record<string, unknown>)["intitule"] as unknown : undefined;
      const adfTitle = typeof adfTitleRaw === "string" && adfTitleRaw.trim() ? adfTitleRaw.trim() : null;

      if (!adfId) return;
      // Keep only category 6 (Competencies/Skills)
      if (categoryId !== "6") return;

      let group = adfMap.get(adfId);
      if (!group) {
        group = { adf_id: adfId, title: adfTitle, evaluations: [] };
        adfMap.set(adfId, group);
      } else if (!group.title && adfTitle) {
        group.title = adfTitle;
      }
    };

    if (Array.isArray(lapsData)) {
      for (const item of lapsData) if (item && typeof item === "object") processItem(item as Record<string, unknown>);
    } else if (lapsData && typeof lapsData === "object") {
      processItem(lapsData as Record<string, unknown>);
      const nested = (lapsData as Record<string, unknown>)["laps"] as unknown;
      if (Array.isArray(nested)) for (const it of nested) if (it && typeof it === "object") processItem(it as Record<string, unknown>);
    }

    // 3) For each ADF, fetch evaluations via the proper endpoint
    const adfIds = Array.from(adfMap.keys());
    if (adfIds.length > 0) {
      const fetchOne = async (adfId: string) => {
        const u = new URL("https://pro.dendreo.com/competences_et_metiers/api/evaluations.php");
        u.searchParams.set("id_action_de_formation", adfId);
        u.searchParams.set("id_participant", participantId!);
        u.searchParams.set("key", apiKey);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15_000);
        try {
          const res = await fetch(u.toString(), { method: "GET", signal: controller.signal });
          const body = await readJsonSafe(res);
          const out: EvalOut[] = [];
          const pushEval = (ev: unknown) => {
            if (!ev || typeof ev !== "object") return;
            const nameRaw = (ev as Record<string, unknown>)["evaluation_name"] as unknown;
            const validatedRaw = (ev as Record<string, unknown>)["validated"] as unknown;
            const appRaw = (ev as Record<string, unknown>)["appreciation"] as unknown;
            const name = typeof nameRaw === "string" ? nameRaw : null;
            const isValidated = validatedRaw === 1 || validatedRaw === "1" || validatedRaw === true || validatedRaw === "true";
            const isPending = validatedRaw === null || validatedRaw === undefined || (typeof validatedRaw === "string" && validatedRaw.trim() === "");
            const validated_label = isPending ? "En cours" : (isValidated ? "Validé" : "Non validé");
            const appreciation = typeof appRaw === "string" ? appRaw : null;
            out.push({ evaluation_name: name, validated: isValidated, validated_label, appreciation });
          };

          if (Array.isArray(body)) {
            for (const item of body) {
              const evs = item && typeof item === "object" ? (item as Record<string, unknown>)["evaluations"] as unknown : undefined;
              if (Array.isArray(evs)) for (const ev of evs) pushEval(ev);
            }
          } else if (body && typeof body === "object") {
            const evs = (body as Record<string, unknown>)["evaluations"] as unknown;
            if (Array.isArray(evs)) for (const ev of evs) pushEval(ev);
          }

          return { adfId, evaluations: out };
        } catch (_) {
          return { adfId, evaluations: [] as EvalOut[] };
        } finally {
          clearTimeout(timeout);
        }
      };

      const results = await Promise.all(adfIds.map(fetchOne));
      for (const r of results) {
        const group = adfMap.get(r.adfId);
        if (group) group.evaluations = r.evaluations;
      }
    }

    const adfs = Array.from(adfMap.values()).map(g => ({ ...g, evaluations: g.evaluations }));

    return new Response(
      JSON.stringify({ email, id_participant: participantId, adfs }),
      { status: 200, headers: { ...headers, "Content-Type": "application/json" } }
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



