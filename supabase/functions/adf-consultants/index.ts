// @ts-nocheck
// supabase/functions/adf-consultants/index.ts
// For given ADF IDs, fetch Dendreo laps and aggregate unique consultants (formateurs)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:5173", "https://yourapp.com"]; // adjust

function corsHeaders(origin: string | null) {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const qpAdfIds = url.searchParams.get("adfIds") || url.searchParams.get("id_action_de_formation");

    let body: any = {};
    if (req.method !== "GET") {
      body = await req.json().catch(() => ({}));
    }

    let adfIds: string[] = [];
    if (Array.isArray(body?.adfIds)) {
      adfIds = body.adfIds.map((v: any) => String(v));
    } else if (typeof qpAdfIds === "string" && qpAdfIds.trim()) {
      adfIds = qpAdfIds.split(",").map((v) => v.trim()).filter(Boolean);
    } else if (body?.adfId || body?.id_action_de_formation) {
      adfIds = [String(body.adfId || body.id_action_de_formation)];
    }

    if (!adfIds.length) {
      return new Response(JSON.stringify({ error: "Missing 'adfId' or 'adfIds' parameter" }), {
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

    const buildLafsUrl = (adfId: string) => {
      const u = new URL("https://pro.dendreo.com/competences_et_metiers/api/lafs.php");
      u.searchParams.set("id_action_de_formation", adfId);
      u.searchParams.set("key", apiKey);
      return u;
    };

    type Consultant = {
      id_formateur: string;
      nom: string | null;
      prenom: string | null;
      email_pro: string | null;
      telephone_pro: string | null;
      photo_url: string | null;
    };

    const perAdf: Record<string, Consultant[]> = {};

    const tasks = adfIds.map(async (adfId) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      try {
        const res = await fetch(buildLafsUrl(adfId).toString(), { method: "GET", signal: controller.signal });
        const body = await readJsonSafe(res);
        if (!res.ok) {
          return { adfId, ok: false, status: res.status, body };
        }

        const consultantsMap = new Map<string, Consultant>();

        const pushFromObj = (obj: Record<string, unknown>) => {
          const formateur = (obj["formateur"] as Record<string, unknown> | undefined) || undefined;
          const idRaw = obj["id_formateur"] ?? formateur?.["id_formateur"];
          const id_formateur = normalizeId(idRaw);
          if (!id_formateur) return;
          const nom = typeof (formateur?.["nom"]) === "string" ? String(formateur?.["nom"]) : (typeof obj["nom_formateur"] === "string" ? String(obj["nom_formateur"]) : null);
          const prenom = typeof (formateur?.["prenom"]) === "string" ? String(formateur?.["prenom"]) : (typeof obj["prenom_formateur"] === "string" ? String(obj["prenom_formateur"]) : null);
          const email_pro = typeof (formateur?.["email_pro"]) === "string" ? String(formateur?.["email_pro"]) : null;
          const telephone_pro = typeof (formateur?.["telephone_pro"]) === "string" ? String(formateur?.["telephone_pro"]) : null;
          const photo_url = typeof (formateur?.["photo_url"]) === "string" && formateur?.["photo_url"].trim() ? String(formateur?.["photo_url"]) : null;
          if (!consultantsMap.has(id_formateur)) {
            consultantsMap.set(id_formateur, { id_formateur, nom, prenom, email_pro, telephone_pro, photo_url });
          } else {
            const existing = consultantsMap.get(id_formateur)!;
            if (!existing.nom && nom) existing.nom = nom;
            if (!existing.prenom && prenom) existing.prenom = prenom;
            if (!existing.email_pro && email_pro) existing.email_pro = email_pro;
            if (!existing.telephone_pro && telephone_pro) existing.telephone_pro = telephone_pro;
            if (!existing.photo_url && photo_url) existing.photo_url = photo_url;
          }
        };

        if (Array.isArray(body)) {
          for (const item of body) if (item && typeof item === "object") pushFromObj(item as Record<string, unknown>);
        } else if (body && typeof body === "object") {
          // Some responses are wrapped under "lafs"
          const lafs = (body as Record<string, unknown>)["lafs"] as unknown;
          if (Array.isArray(lafs)) for (const it of lafs) if (it && typeof it === "object") pushFromObj(it as Record<string, unknown>);
          else pushFromObj(body as Record<string, unknown>);
        }

        perAdf[adfId] = Array.from(consultantsMap.values());
        return { adfId, ok: true };
      } catch (err) {
        const msg = err instanceof Error && err.name === "AbortError" ? "Upstream request timed out" : (err as Error)?.message ?? "Unexpected error";
        return { adfId, ok: false, status: 502, body: { error: msg } };
      } finally {
        clearTimeout(timeout);
      }
    });

    const results = await Promise.all(tasks);
    const failed = results.find((r) => !r.ok);
    if (failed) {
      return new Response(JSON.stringify({ error: "Upstream error", details: failed.body || null }), {
        status: failed.status || 502,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // Also return a flattened list of unique consultants across all ADFs
    const allMap = new Map<string, Consultant>();
    for (const list of Object.values(perAdf)) {
      for (const c of list) {
        if (!allMap.has(c.id_formateur)) allMap.set(c.id_formateur, c);
      }
    }

    return new Response(
      JSON.stringify({ adf_ids: adfIds, per_adf: perAdf, consultants: Array.from(allMap.values()) }),
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


