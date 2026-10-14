import { createClient } from '@supabase/supabase-js';

function readEnv(rawValue: string | undefined, name: string): string {
  let value = (rawValue || '').trim().replace(/^["']|["']$/g, '');
  const prefix = `${name}=`;
  if (value.startsWith(prefix)) {
    value = value.slice(prefix.length).trim().replace(/^["']|["']$/g, '');
  }
  return value;
}

const rawUrl = readEnv(import.meta.env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL');
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = readEnv(import.meta.env.VITE_SUPABASE_ANON_KEY, 'VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured =
  supabaseUrl !== '' &&
  supabaseAnonKey !== '' &&
  !supabaseUrl.includes('YOUR_PROJECT_ID') &&
  !supabaseAnonKey.includes('YOUR_ANON_KEY');

// Jika belum dikonfigurasi, gunakan dummy URL agar createClient tidak melempar error startup
const validUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const validKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key';

export const supabase = createClient(validUrl, validKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
