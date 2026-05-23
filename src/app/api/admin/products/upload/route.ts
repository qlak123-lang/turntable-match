import { NextResponse } from 'next/server';
import { getSession } from '@/utils/session';
import fs from 'fs';
import path from 'path';

// Lazily import getStore to prevent import errors if not deployed
let getStore: any = null;
try {
  const blobsPkg = require('@netlify/blobs');
  getStore = blobsPkg.getStore;
} catch (e) {
  console.warn('@netlify/blobs require failed in Server Route');
}

export async function POST(request: Request) {
  const sessionUser = await getSession();

  if (!sessionUser || !sessionUser.isAdmin) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: '업로드된 파일이 없습니다.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeFilename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;

    // 1. Try Netlify Blobs if in Netlify environment and getStore is available
    if (getStore && (process.env.NETLIFY || process.env.NETLIFY_IMAGES_KEY || process.env.NETLIFY_SITE_ID)) {
      try {
        const store = getStore({ name: 'products-thumbnails', consistency: 'strong' });
        await store.set(safeFilename, buffer);
        const imageUrl = `/api/products/images?key=${safeFilename}`;
        return NextResponse.json({ imageUrl, success: true });
      } catch (blobErr) {
        console.error('Netlify Blobs upload failed, falling back to local storage:', blobErr);
      }
    }

    // 2. Local Fallback: Save to public/uploads directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, safeFilename);
    fs.writeFileSync(filePath, buffer);
    
    const imageUrl = `/uploads/${safeFilename}`;
    return NextResponse.json({ imageUrl, success: true });
  } catch (err: any) {
    console.error('File upload error:', err);
    return NextResponse.json({ error: err.message || '파일 업로드 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
export const config = {
  api: {
    bodyParser: false, // Disabling Next.js body parser to process multipart data
  },
};
