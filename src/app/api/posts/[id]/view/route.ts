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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDbPool();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured', fallback: true }, { status: 200 });
  }

  try {
    const { id } = await params;
    const intId = parseInt(id, 10);
    if (isNaN(intId)) {
      return NextResponse.json({ error: 'Invalid post ID format', fallback: true }, { status: 200 });
    }

    const rows = await dbQuery(
      'UPDATE posts SET views = views + 1 WHERE id = $1 RETURNING *',
      [intId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const formatted = formatDbPost(rows[0]);
    revalidatePath('/community');
    revalidatePath(`/community/${id}`);
    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error('Error incrementing post views in database:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
