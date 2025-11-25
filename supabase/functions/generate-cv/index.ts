// @ts-nocheck
// supabase/functions/generate-cv/index.ts
// Generate a CV using Mistral AI based on user data and additional instructions

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "https://yourapp.com"
];

function corsHeaders(origin: string | null) {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin, Access-Control-Request-Method, Access-Control-Request-Headers",
  };
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  // CORS preflight
  if (req.method === "OPTIONS") {
    const requested = (req.headers.get("access-control-request-headers") || "")
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean);
    const defaultAllowed = (headers["Access-Control-Allow-Headers"] || "")
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean);
    const merged = Array.from(new Set([...defaultAllowed, ...requested])).join(", ");
    const preflightHeaders = {
      ...headers,
      "Access-Control-Allow-Headers": merged || headers["Access-Control-Allow-Headers"],
      "Access-Control-Max-Age": "86400",
    } as Record<string, string>;
    return new Response(null, { headers: preflightHeaders, status: 200 });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  try {
    // Extract user data from JWT (similar to get-adf function)
    let userEmail: string | null = null;
    let userPhone: string | null = null;
    let userName: string | null = null;
    let userFullName: string | null = null;
    
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const jwt = authHeader.slice("Bearer ".length).trim();
      try {
        const parts = jwt.split(".");
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload && typeof payload === "object") {
            // Extract email
            userEmail = payload["email"] ?? payload["user_metadata"]?.["email"] ?? null;
            
            // Extract phone
            userPhone = payload["phone"] ?? payload["user_metadata"]?.["phone"] ?? null;
            
            // Extract name variations
            userName = payload["user_metadata"]?.["name"] ?? 
                      payload["user_metadata"]?.["full_name"] ?? 
                      payload["user_metadata"]?.["first_name"] ?? null;
            
            userFullName = payload["user_metadata"]?.["full_name"] ?? null;
            
            // If we have first_name and last_name separately
            const firstName = payload["user_metadata"]?.["first_name"];
            const lastName = payload["user_metadata"]?.["last_name"];
            if (firstName && lastName && !userFullName) {
              userFullName = `${firstName} ${lastName}`;
            }
            
            // Use full_name as userName if available
            if (userFullName && !userName) {
              userName = userFullName;
            }
          }
        }
      } catch (_) {
        // ignore jwt decode issues
      }
    }

    if (!userEmail) {
      return new Response(JSON.stringify({ error: "User authentication required" }), {
        status: 401,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await req.json();
    const additionalInstructions = body.additionalInstructions || "";

    // Get Mistral API key from environment
    const mistralApiKey = Deno.env.get("MISTRAL_API_KEY");
    if (!mistralApiKey) {
      return new Response(
        JSON.stringify({ error: "Mistral API key not configured" }),
        { status: 500, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    // Build the prompt for CV generation in French
    const prompt = `Vous êtes un rédacteur professionnel de CV. Générez un CV complet et professionnel EN FRANÇAIS pour l'utilisateur suivant.

Informations de l'utilisateur :
${userName ? `- Nom : ${userName}` : ""}
- Email : ${userEmail}
${userPhone ? `- Téléphone : ${userPhone}` : ""}

Instructions supplémentaires de l'utilisateur :
${additionalInstructions || "Aucune instruction supplémentaire fournie."}

Créez un CV professionnel avec les sections suivantes (ajustez en fonction des informations disponibles) :
1. COORDONNÉES
2. RÉSUMÉ PROFESSIONNEL (ou PROFIL)
3. EXPÉRIENCE PROFESSIONNELLE (si mentionnée dans les instructions)
4. FORMATION (si mentionnée dans les instructions)
5. COMPÉTENCES (si mentionnées dans les instructions)
6. CERTIFICATIONS (si mentionnées dans les instructions)
7. INFORMATIONS COMPLÉMENTAIRES (si pertinent - langues, centres d'intérêt, etc.)

FORMAT REQUIS - TRÈS IMPORTANT :
- Rédigez TOUT en français
- Utilisez des TITRES DE SECTION EN MAJUSCULES (ex: COORDONNÉES, EXPÉRIENCE PROFESSIONNELLE)
- Utilisez EXACTEMENT le format suivant pour les sections :

COORDONNÉES
${userName || "[Nom complet]"}
Email : ${userEmail}
${userPhone ? `Téléphone : ${userPhone}` : ""}

---

RÉSUMÉ PROFESSIONNEL
[Votre résumé professionnel ici]

---

EXPÉRIENCE PROFESSIONNELLE

**[Titre du poste]**
[Entreprise] | [Dates]

• [Accomplissement ou responsabilité 1]
• [Accomplissement ou responsabilité 2]
• [Accomplissement ou responsabilité 3]

---

FORMATION

**[Diplôme]**
[Institution] | [Année]

---

COMPÉTENCES

• [Compétence 1]
• [Compétence 2]

RÈGLES STRICTES :
- Sections en MAJUSCULES uniquement
- Sous-titres avec **double astérisques**
- Puces avec • (caractère bullet point)
- Séparateurs : --- entre sections principales
- PAS de markdown pour les sections principales
- Utilisez les vraies données fournies (nom, email, téléphone)
- Soyez professionnel et précis`;

    // Call Mistral API
    const mistralResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mistralApiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!mistralResponse.ok) {
      const errorText = await mistralResponse.text();
      console.error("Mistral API error:", errorText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to generate CV", 
          details: errorText 
        }),
        { 
          status: mistralResponse.status, 
          headers: { ...headers, "Content-Type": "application/json" } 
        }
      );
    }

    const mistralData = await mistralResponse.json();
    const generatedCV = mistralData.choices?.[0]?.message?.content || "";

    if (!generatedCV) {
      return new Response(
        JSON.stringify({ error: "No CV content generated" }),
        { status: 500, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        cv: generatedCV,
        userEmail,
        userName: userName || null,
        userPhone: userPhone || null,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...headers, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Error generating CV:", err);
    const msg = (err as Error)?.message ?? "Unexpected error";
    return new Response(
      JSON.stringify({ error: msg }),
      {
        status: 500,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      }
    );
  }
});

