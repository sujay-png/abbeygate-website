import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

// In production, you should set a strong secret in your environment variables:
// SESSION_SECRET="your-very-long-and-secure-random-string-here"
const secretKey = process.env.SESSION_SECRET || 'abbeygate-england-fallback-secret-do-not-use-in-production';
const encodedKey = new TextEncoder().encode(secretKey);

type SessionPayload = {
  userId: number;
  email: string;
  roles: string[];
  expiresAt: Date;
};

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = '') {
  try {
    if (!session) return null;
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload as SessionPayload;
  } catch (error) {
    // console.log('Failed to verify session');
    return null;
  }
}

export async function createSession(userId: number, email: string, roles: string[]) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await encrypt({ userId, email, roles, expiresAt });

  const cookieStore = await cookies();
  
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  return await decrypt(session);
}
