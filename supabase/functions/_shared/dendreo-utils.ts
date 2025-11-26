/**
 * Shared utilities for handling Dendreo API responses
 * 
 * The Dendreo API returns different formats depending on the number of results:
 * - Single item: Returns an object { id: "123", ... }
 * - Multiple items: Returns an array [{ id: "1" }, { id: "2" }]
 * - Sometimes wrapped: Returns { data: [...] } or { items: [...] }
 */

/**
 * Normalizes Dendreo API responses to always return an array
 * Handles single objects, arrays, and various wrapper formats
 * 
 * @param data - The raw API response
 * @param options - Configuration options
 * @returns Array of items
 */
export function normalizeToArray<T = any>(
  data: unknown,
  options?: {
    /** Property name to check for single object identification (e.g., 'id_creneau', 'id_participant') */
    idProperty?: string;
    /** Possible wrapper property names (e.g., 'data', 'creneaux', 'laps') */
    wrapperProperties?: string[];
  }
): T[] {
  const idProp = options?.idProperty;
  const wrappers = options?.wrapperProperties || ['data', 'items'];

  // Already an array
  if (Array.isArray(data)) {
    return data as T[];
  }

  // Not an object
  if (!data || typeof data !== 'object') {
    return [];
  }

  const obj = data as Record<string, unknown>;

  // Check for wrapper properties
  for (const wrapper of wrappers) {
    if (Array.isArray(obj[wrapper])) {
      return obj[wrapper] as T[];
    }
  }

  // Single object with ID property
  if (idProp && obj[idProp]) {
    return [data as T];
  }

  // Fallback: if object has some common ID properties, treat as single item
  const commonIds = ['id', 'id_creneau', 'id_lap', 'id_participant', 'id_formateur', 'id_action_de_formation'];
  for (const id of commonIds) {
    if (obj[id]) {
      return [data as T];
    }
  }

  // Empty result
  return [];
}

/**
 * Helper to read JSON safely from a Response
 */
export async function readJsonSafe(res: Response): Promise<unknown> {
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

