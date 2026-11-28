import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

// In production, SESSION_SECRET must be configured in environment variables.
const DEV_FALLBACK_SECRET = 'abbeygate-england-fallback-secret-do-not-use-in-production';

function getEncodedKey(): Uint8Array {
  const secretKey = process.env.SESSION_SECRET?.trim();
  if (!secretKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET is not configured in production.');
    }
    return new TextEncoder().encode(DEV_FALLBACK_SECRET);
  }
  return new TextEncoder().encode(secretKey);
}

export type SessionPayload = {
  userId: number;
  email: string;
  roles: string[];
  emailVerified?: boolean;
  expiresAt: Date;
};

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getEncodedKey());
}

export async function decrypt(session: string | undefined = '') {
  try {
    if (!session) return null;
    const { payload } = await jwtVerify(session, getEncodedKey(), {
      algorithms: ['HS256'],
    });
    return payload as SessionPayload;
  } catch {
    console.log('Failed to verify session');
    return null;
  }
}

export async function createSession(
  userId: number,
  email: string,
  roles: string[],
  options?: { emailVerified?: boolean },
) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await encrypt({
    userId,
    email,
    roles,
    emailVerified: options?.emailVerified ?? true,
    expiresAt,
  });

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
