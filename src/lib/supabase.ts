import { createClient } from '@supabase/supabase-js';
import { createServerClient as createSupabaseSsrClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

function getClient(url: string, key: string) {
  if (!url || !key) {
    return null as any;
  }
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const supabase = getClient(supabaseUrl, supabaseAnonKey);

export const createServerClient = async () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return getClient(supabaseUrl, supabaseAnonKey);
  }
  const cookieStore = await cookies();
  return createSupabaseSsrClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component; safe to ignore when middleware handles refresh.
        }
      },
    },
  });
};

export const createServiceClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  return getClient(supabaseUrl, serviceKey);
};