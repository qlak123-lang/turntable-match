import { NextResponse } from 'next/server';
import { deleteSession } from '@/utils/session';
import { getDbPool } from '@/utils/db';

export async function POST() {
  const db = getDbPool();
  await deleteSession();
  
  if (!db) {
    return NextResponse.json({ fallback: true, success: true });
  }

  return NextResponse.json({ success: true });
}
