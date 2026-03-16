import { createHash } from 'crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'admin_token';

export function makeAdminToken(password: string): string {
  const secret = process.env.AUTH_SECRET ?? 'dev-secret';
  return createHash('sha256').update(`admin:${password}:${secret}`).digest('hex');
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  const adminPassword = process.env.ADMIN_PASSWORD ?? '';
  if (!adminPassword || !token) return false;
  return token === makeAdminToken(adminPassword);
}
