import { NextResponse } from 'next/server';
import { dbQuery, getDbPool } from '@/utils/db';
import { getSession } from '@/utils/session';
import { revalidatePath } from 'next/cache';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDbPool();
  const sessionUser = await getSession();

  if (!sessionUser || !sessionUser.isAdmin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 });
  }

  if (!db) {
    return NextResponse.json({ fallback: true });
  }

  try {
    const { id } = await params;
    const intId = parseInt(id, 10);
    if (isNaN(intId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, price, category, imageUrl } = body;

    if (!title || !description || price === undefined || !category) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    const rows = await dbQuery(
      'UPDATE products SET title = $1, description = $2, price = $3, category = $4, image_url = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [title, description, parseInt(price, 10), category, imageUrl || null, intId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    revalidatePath('/store');
    return NextResponse.json(rows[0]);
  } catch (err: any) {
    console.error('Error updating product in database:', err);
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
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 });
  }

  if (!db) {
    return NextResponse.json({ fallback: true });
  }

  try {
    const { id } = await params;
    const intId = parseInt(id, 10);
    if (isNaN(intId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const rows = await dbQuery('DELETE FROM products WHERE id = $1 RETURNING *', [intId]);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    revalidatePath('/store');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting product in database:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
