import { NextResponse } from 'next/server';
import { getUser } from './auth';

export async function requireAdmin() {
  if (!(await getUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
