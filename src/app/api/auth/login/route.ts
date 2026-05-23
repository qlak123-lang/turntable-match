import { NextResponse } from 'next/server';
import { dbQuery, getDbPool } from '@/utils/db';
import { setSession } from '@/utils/session';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: Request) {
  const db = getDbPool();
  if (!db) {
    return NextResponse.json({ fallback: true }, { status: 200 });
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호를 모두 입력해 주세요.' }, { status: 400 });
    }

    const users = await dbQuery('SELECT * FROM users WHERE email = $1', [email]);
    if (users.length === 0) {
      return NextResponse.json({ error: '이메일 주소 또는 비밀번호가 올바르지 않습니다.' }, { status: 400 });
    }

    const user = users[0];
    const passwordHash = hashPassword(password);

    if (user.password_hash !== passwordHash) {
      return NextResponse.json({ error: '이메일 주소 또는 비밀번호가 올바르지 않습니다.' }, { status: 400 });
    }

    await setSession(user);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      isAdmin: user.is_admin
    });
  } catch (err: any) {
    console.error('Login database error:', err);
    return NextResponse.json({ error: err.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
