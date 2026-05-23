import { NextResponse } from 'next/server';
import { dbQuery, getDbPool } from '@/utils/db';
import { getSession } from '@/utils/session';

export async function POST(request: Request) {
  const sessionUser = await getSession();

  if (!sessionUser) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const db = getDbPool();
  if (!db) {
    // Database connection is down, client-side must write to localStorage
    return NextResponse.json({ fallback: true });
  }

  try {
    const body = await request.json();
    const { productId, paymentMethod } = body;

    if (!productId || !paymentMethod) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    // 1. Fetch the product price
    const parsedId = parseInt(productId, 10);
    if (isNaN(parsedId)) {
      // In case the client sends string format like "prod-1" during local storage fallback
      // but in database it expects integer SERIAL IDs.
      return NextResponse.json({ error: '유효하지 않은 상품 ID입니다.' }, { status: 400 });
    }

    const products = await dbQuery('SELECT price FROM products WHERE id = $1', [parsedId]);
    if (products.length === 0) {
      return NextResponse.json({ error: '상품을 찾을 수 없습니다.' }, { status: 404 });
    }

    const price = products[0].price;

    // 2. Insert order record
    const rows = await dbQuery(
      'INSERT INTO orders (user_id, product_id, price, payment_method) VALUES ($1, $2, $3, $4) RETURNING *',
      [sessionUser.id, parsedId, price, paymentMethod]
    );

    if (rows.length === 0) {
      throw new Error('Failed to create order record.');
    }

    return NextResponse.json(rows[0]);
  } catch (err: any) {
    console.error('Error creating order record in database:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
