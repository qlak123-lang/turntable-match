import { NextResponse } from 'next/server';
import { dbQuery, getDbPool } from '@/utils/db';
import { getSession } from '@/utils/session';

export async function GET() {
  const db = getDbPool();
  const sessionUser = await getSession();
  
  if (!sessionUser || !sessionUser.isAdmin) {
    return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 401 });
  }

  if (!db) {
    return NextResponse.json({ fallback: true });
  }

  try {
    const rows = await dbQuery(
      'SELECT id, email, nickname, is_admin AS "isAdmin", created_at AS "createdAt" FROM users ORDER BY created_at DESC'
    );
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('Error fetching admin users list:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const db = getDbPool();
  const sessionUser = await getSession();
  
  if (!sessionUser || !sessionUser.isAdmin) {
    return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 401 });
  }

  if (!db) {
    return NextResponse.json({ fallback: true });
  }

  try {
    const { userId, isAdmin } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId가 필요합니다.' }, { status: 400 });
    }

    const intUserId = parseInt(userId, 10);
    await dbQuery('UPDATE users SET is_admin = $1 WHERE id = $2', [!!isAdmin, intUserId]);
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error updating user in database:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const db = getDbPool();
  const sessionUser = await getSession();
  
  if (!sessionUser || !sessionUser.isAdmin) {
    return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 401 });
  }

  if (!db) {
    return NextResponse.json({ fallback: true });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId가 필요합니다.' }, { status: 400 });
    }

    const intUserId = parseInt(userId, 10);
    
    // Prevent admin from deleting themselves
    if (intUserId === sessionUser.id) {
      return NextResponse.json({ error: '자기 자신의 계정은 삭제할 수 없습니다.' }, { status: 400 });
    }

    await dbQuery('DELETE FROM users WHERE id = $1', [intUserId]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting user in database:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
