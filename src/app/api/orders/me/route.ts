import { NextResponse } from 'next/server';
import { dbQuery, getDbPool } from '@/utils/db';
import { getSession } from '@/utils/session';

export async function GET() {
  const sessionUser = await getSession();

  if (!sessionUser) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const db = getDbPool();
  if (!db) {
    return NextResponse.json({ fallback: true });
  }

  try {
    const rows = await dbQuery(
      `SELECT o.*, p.title as product_title, p.image_url as product_image_url, p.category as product_category
       FROM orders o
       JOIN products p ON o.product_id = p.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [sessionUser.id]
    );

    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('Error fetching orders from database:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
