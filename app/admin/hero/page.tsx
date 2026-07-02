import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminHeroClient from './AdminHeroClient';
import { ADMIN_COOKIE, makeAdminToken } from '@/lib/adminAuth';

export default async function AdminHeroPage() {
  const adminPassword = process.env.ADMIN_PASSWORD ?? '';
  if (!adminPassword) redirect('/admin');

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token || token !== makeAdminToken(adminPassword)) redirect('/admin');

  return <AdminHeroClient />;
}
