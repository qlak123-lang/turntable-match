import { NextResponse } from 'next/server';
import { dbQuery, getDbPool } from '@/utils/db';
import { revalidatePath } from 'next/cache';

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

export async function GET() {
  const db = getDbPool();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured', fallback: true }, { status: 200 });
  }

  try {
    const rows = await dbQuery('SELECT * FROM posts ORDER BY created_at DESC');
    const formatted = rows.map(formatDbPost);
    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error('Error fetching posts from database:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const db = getDbPool();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured', fallback: true }, { status: 200 });
  }

  try {
    const body = await request.json();
    const { title, content, nickname, category } = body;

    if (!title || !content || !nickname) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const rows = await dbQuery(
      'INSERT INTO posts (title, content, nickname, category, views) VALUES ($1, $2, $3, $4, 0) RETURNING *',
      [title, content, nickname, category || 'general']
    );

    if (rows.length === 0) {
      throw new Error('Failed to insert post');
    }

    const formatted = formatDbPost(rows[0]);
    revalidatePath('/community');
    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error('Error creating post in database:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
