import { NextResponse } from 'next/server';
import { dbQuery, getDbPool } from '@/utils/db';
import { getSession } from '@/utils/session';

function formatDbPost(row: any) {
  const date = new Date(row.created_at);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const createdAt = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  return {
    id: row.id.toString(),
    title: row.title,
    content: row.content,
    nickname: row.nickname,
    category: row.category,
    views: row.views,
    createdAt
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDbPool();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured', fallback: true }, { status: 200 });
  }

  try {
    const { id } = await params;
    
    // Check if ID is integer (db primary key in schema.sql is SERIAL id)
    const intId = parseInt(id, 10);
    if (isNaN(intId)) {
      return NextResponse.json({ error: 'Invalid post ID format', fallback: true }, { status: 200 });
    }

    const rows = await dbQuery('SELECT * FROM posts WHERE id = $1', [intId]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const formatted = formatDbPost(rows[0]);
    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error('Error fetching post from database:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDbPool();
  const sessionUser = await getSession();
  
  if (!sessionUser || !sessionUser.isAdmin) {
    return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 401 });
  }

  if (!db) {
    return NextResponse.json({ fallback: true }, { status: 200 });
  }

  try {
    const { id } = await params;
    const intId = parseInt(id, 10);
    if (isNaN(intId)) {
      return NextResponse.json({ error: 'Invalid post ID format', fallback: true }, { status: 200 });
    }

    await dbQuery('DELETE FROM posts WHERE id = $1', [intId]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting post in database:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDbPool();
  const sessionUser = await getSession();
  
  if (!sessionUser || !sessionUser.isAdmin) {
    return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 401 });
  }

  if (!db) {
    return NextResponse.json({ fallback: true }, { status: 200 });
  }

  try {
    const { id } = await params;
    const intId = parseInt(id, 10);
    if (isNaN(intId)) {
      return NextResponse.json({ error: 'Invalid post ID format', fallback: true }, { status: 200 });
    }

    const { title, content, category } = await request.json();
    if (!title || !content || !category) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
    }

    await dbQuery(
      'UPDATE posts SET title = $1, content = $2, category = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
      [title, content, category, intId]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error updating post in database:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
