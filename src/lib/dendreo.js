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


export async function fetchAdfIds() {
  const { data: { session } } = await supabase.auth.getSession();
  const jwt = session?.access_token;
  const base = supabaseUrl || import.meta.env.VITE_SUPABASE_URL || '';
  const url = `${base}/functions/v1/get-adf`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || `Failed to load ADF ids (${res.status})`);
  }

  return res.json();
}

export async function fetchConsultantsByAdfIds(adfIds) {
  const { data: { session } } = await supabase.auth.getSession();
  const jwt = session?.access_token;
  const base = supabaseUrl || import.meta.env.VITE_SUPABASE_URL || '';
  const url = `${base}/functions/v1/adf-consultants`;

  const payload = Array.isArray(adfIds) ? { adfIds } : { adfIds: [] };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || `Failed to load consultants (${res.status})`);
  }

  return res.json();
}

export function formatFrenchPhoneNumber(input) {
  if (!input || typeof input !== 'string') return '';
  const digits = input.replace(/\D/g, '');
  // If starts with 33 and not 0, normalize to 0X...
  let normalized = digits;
  if (normalized.startsWith('33') && !normalized.startsWith('330')) {
    normalized = '0' + normalized.slice(2);
  }
  if (!normalized.startsWith('0') && normalized.length === 9) {
    normalized = '0' + normalized;
  }
  const pairs = normalized.slice(0, 10).match(/\d{1,2}/g) || [];
  return pairs.join(' ');
}

export async function fetchStaffById(id) {
  if (!id) throw new Error('Missing staff id');
  const { data: { session } } = await supabase.auth.getSession();
  const jwt = session?.access_token;
  const base = supabaseUrl || import.meta.env.VITE_SUPABASE_URL || '';
  const url = `${base}/functions/v1/staff?id=${encodeURIComponent(id)}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || `Failed to load staff (${res.status})`);
  }

  return res.json();
}


