import { createServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ success: true });
  }
  await supabase.auth.signOut();
  const home = new URL(request.url).origin;
  return NextResponse.redirect(new URL('/admin/login', home));
}
