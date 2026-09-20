import { createServerClient } from './supabase';

export async function getSession() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const session = await getSession();
  return session?.user ?? null;
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
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
}