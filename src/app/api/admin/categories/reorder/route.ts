import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-api';
import { markPdfOutdated } from '@/lib/pdf-status';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const supabase = createServiceClient();
  const { updates } = await request.json();

  if (!Array.isArray(updates)) {
    return NextResponse.json({ error: 'Invalid updates' }, { status: 400 });
  }

  for (const update of updates) {
    const { error } = await supabase
      .from('categories')
      .update({ display_order: update.display_order })
      .eq('id', update.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await markPdfOutdated();
  return NextResponse.json({ success: true });
}