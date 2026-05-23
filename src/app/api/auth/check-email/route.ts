import { NextResponse } from 'next/server';
import { dbQuery, getDbPool } from '@/utils/db';

export async function POST(request: Request) {
  const db = getDbPool();
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: '이메일을 입력해 주세요.' }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ fallback: true });
    }

    const rows = await dbQuery('SELECT COUNT(*) AS count FROM users WHERE email = $1', [email.trim()]);
    const count = parseInt(rows[0]?.count || '0', 10);

    return NextResponse.json({ exists: count > 0 });
  } catch (err: any) {
    console.error('Email duplicate check error:', err);
    return NextResponse.json({ error: err.message || '오류가 발생했습니다.' }, { status: 500 });
  }
}
