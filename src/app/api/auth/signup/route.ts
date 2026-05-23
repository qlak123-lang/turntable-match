import { NextResponse } from 'next/server';
import { dbQuery, getDbPool } from '@/utils/db';
import { setSession } from '@/utils/session';
import crypto from 'crypto';

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: Request) {
  const db = getDbPool();
  if (!db) {
    return NextResponse.json({ fallback: true }, { status: 200 });
  }

  try {
    const { email, password, nickname, isAdmin } = await request.json();

    if (!email || !password || !nickname) {
      return NextResponse.json({ error: '필수 입력 항목이 누락되었습니다.' }, { status: 400 });
    }

    // Check if user already exists
    const existingUsers = await dbQuery('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUsers.length > 0) {
      return NextResponse.json({ error: '이미 등록된 이메일 주소입니다.' }, { status: 400 });
    }

    const passwordHash = hashPassword(password);
    const is_admin = !!isAdmin;

    const result = await dbQuery(
      'INSERT INTO users (email, password_hash, nickname, is_admin) VALUES ($1, $2, $3, $4) RETURNING id, email, nickname, is_admin',
      [email, passwordHash, nickname, is_admin]
    );

    if (result.length === 0) {
      throw new Error('사용자 등록에 실패했습니다.');
    }

    const newUser = result[0];
    await setSession(newUser);

    return NextResponse.json({
      id: newUser.id,
      email: newUser.email,
      nickname: newUser.nickname,
      isAdmin: newUser.is_admin
    });
  } catch (err: any) {
    console.error('Signup database error:', err);
    return NextResponse.json({ error: err.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
