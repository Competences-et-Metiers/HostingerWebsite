import { supabase, supabaseUrl } from '@/lib/customSupabaseClient';

export async function fetchAdfCompetencies() {
  const { data: { session } } = await supabase.auth.getSession();
  const jwt = session?.access_token;
  const base = supabaseUrl || import.meta.env.VITE_SUPABASE_URL || '';
  const url = `${base}/functions/v1/adf-competencies`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || `Failed to load ADF competencies (${res.status})`);
  }

  return res.json();
}


