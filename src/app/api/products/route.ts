import { NextResponse } from 'next/server';
import { dbQuery, getDbPool } from '@/utils/db';
import { getSession } from '@/utils/session';
import { revalidatePath } from 'next/cache';

export async function GET() {
  const db = getDbPool();
  if (!db) {
    return NextResponse.json({ fallback: true });
  }

  try {
    const rows = await dbQuery('SELECT * FROM products ORDER BY id DESC');
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('Error fetching products from database:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const db = getDbPool();
  const sessionUser = await getSession();

  if (!sessionUser || !sessionUser.isAdmin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 });
  }

  if (!db) {
    return NextResponse.json({ fallback: true });
  }

  try {
    const body = await request.json();
    const { title, description, price, category, imageUrl } = body;

    if (!title || !description || price === undefined || !category) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    const rows = await dbQuery(
      'INSERT INTO products (title, description, price, category, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, parseInt(price, 10), category, imageUrl || null]
    );

    if (rows.length === 0) {
      throw new Error('Failed to insert product');
    }

    revalidatePath('/store');
    return NextResponse.json(rows[0]);
  } catch (err: any) {
    console.error('Error creating product in database:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
