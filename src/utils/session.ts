import { cookies } from 'next/headers';

export interface SessionUser {
  id: number;
  email: string;
  nickname: string;
  isAdmin: boolean;
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie) return null;
    
    const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
    return JSON.parse(decoded) as SessionUser;
  } catch (error) {
    console.error('Error decoding session cookie:', error);
    return null;
  }
}

export async function setSession(user: { id: number; email: string; nickname: string; is_admin: boolean } | SessionUser) {
  try {
    const cookieStore = await cookies();
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      isAdmin: 'is_admin' in user ? user.is_admin : (user as SessionUser).isAdmin,
    };
    const sessionData = JSON.stringify(sessionUser);
    const encoded = Buffer.from(sessionData).toString('base64');
    
    cookieStore.set('session', encoded, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
  } catch (error) {
    console.error('Error setting session cookie:', error);
  }
}

export async function deleteSession() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');
  } catch (error) {
    console.error('Error deleting session cookie:', error);
  }
}
