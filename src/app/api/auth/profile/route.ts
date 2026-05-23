import { NextResponse } from 'next/server';
import { getSession, setSession, deleteSession } from '@/utils/session';
import { dbQuery, getDbPool } from '@/utils/db';

export async function PATCH(request: Request) {
  const db = getDbPool();
  const sessionUser = await getSession();
  
  if (!sessionUser) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    const { nickname } = await request.json();
    if (!nickname || !nickname.trim()) {
      return NextResponse.json({ error: '닉네임을 입력해 주세요.' }, { status: 400 });
    }

    const trimmedNickname = nickname.trim();

    if (!db) {
      // In fallback mode, let the client handle local storage sync
      return NextResponse.json({ fallback: true });
    }

    // Update users table in Neon PostgreSQL database
    await dbQuery('UPDATE users SET nickname = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
      trimmedNickname,
      sessionUser.id
    ]);

    // Update the active session cookie
    const updatedUser = {
      ...sessionUser,
      nickname: trimmedNickname
    };
    await setSession(updatedUser);

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    console.error('Error updating user nickname:', err);
    return NextResponse.json({ error: err.message || '닉네임 변경 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE() {
  const db = getDbPool();
  const sessionUser = await getSession();
  
  if (!sessionUser) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    if (!db) {
      // In fallback mode, let the client handle local storage sync and clear session
      await deleteSession();
      return NextResponse.json({ fallback: true });
    }

    // Delete user from Neon PostgreSQL database
    await dbQuery('DELETE FROM users WHERE id = $1', [sessionUser.id]);

    // Clear session cookie
    await deleteSession();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting user account:', err);
    return NextResponse.json({ error: err.message || '회원 탈퇴 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
