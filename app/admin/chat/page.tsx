import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminChatClient from './AdminChatClient'
import { ADMIN_COOKIE, makeAdminToken } from '@/lib/adminAuth'

export default async function AdminChatPage() {
  const adminPassword = process.env.ADMIN_PASSWORD ?? ''
  if (!adminPassword) redirect('/admin')

  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE)?.value
  if (!token || token !== makeAdminToken(adminPassword)) redirect('/admin')

  return <AdminChatClient />
}
