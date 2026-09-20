import { createServerClient } from './supabase';

export async function getSession() {
  const supabase = await createServerClient();
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const supabase = await createServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    return { user: null, redirect: '/admin/login' };
  }
  return { user, redirect: null };
}

export async function signIn(email: string, password: string) {
  const supabase = await createServerClient();
  if (!supabase) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const supabase = await createServerClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}
