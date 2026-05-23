import { NextResponse } from 'next/server';

let getStore: any = null;
try {
  const blobsPkg = require('@netlify/blobs');
  getStore = blobsPkg.getStore;
} catch (e) {
  console.warn('@netlify/blobs require failed in Server Route');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (!key) {
    return new Response('Missing key', { status: 400 });
  }

  if (!getStore) {
    return new Response('Blobs storage not supported', { status: 500 });
  }

  try {
    const store = getStore({ name: 'products-thumbnails', consistency: 'strong' });
    const blob = await store.get(key, { type: 'stream' });

    if (!blob) {
      return new Response('Image not found', { status: 404 });
    }

    // Determine content type based on file extension
    let contentType = 'image/png';
    if (key.endsWith('.jpg') || key.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (key.endsWith('.webp')) {
      contentType = 'image/webp';
    } else if (key.endsWith('.gif')) {
      contentType = 'image/gif';
    }

    return new Response(blob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (err: any) {
    console.error('Error fetching blob:', err);
    return new Response('Error retrieving image', { status: 500 });
  }
}
