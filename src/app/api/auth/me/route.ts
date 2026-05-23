import { NextResponse } from 'next/server';
import { getSession } from '@/utils/session';
import { getDbPool } from '@/utils/db';

export async function GET() {
  const db = getDbPool();
  if (!db) {
    return NextResponse.json({ fallback: true }, { status: 200 });
  }

  try {
    const user = await getSession();
    return NextResponse.json({ user });
  } catch (err: any) {
    console.error('Session get error:', err);
    return NextResponse.json({ error: err.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
