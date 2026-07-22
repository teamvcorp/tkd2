import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminRegisterClient from './AdminRegisterClient';
import { ADMIN_COOKIE, makeAdminToken } from '@/lib/adminAuth';

// Same server-side admin gate used by the other /admin sub-pages (see
// app/admin/hero/page.tsx). Redirects to the login screen if not authenticated.
export default async function AdminRegisterPage() {
  const adminPassword = process.env.ADMIN_PASSWORD ?? '';
  if (!adminPassword) redirect('/admin');

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token || token !== makeAdminToken(adminPassword)) redirect('/admin');

  return <AdminRegisterClient />;
}
