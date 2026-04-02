import { NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/adminAuth"
import { getActiveThreads, getWaitingThreads, getClosedThreads } from "@/lib/threadStore"

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const [active, waiting, closed] = await Promise.all([
      getActiveThreads(),
      getWaitingThreads(),
      getClosedThreads(),
    ])

    const mapThread = (t: { id: string; topic: string; createdAt: string; status: string; visitorName: string; queuePosition?: number }) => ({
      id: t.id,
      topic: t.topic,
      visitorName: t.visitorName,
      lastMessageReceivedOn: t.createdAt,
      status: t.status,
      queuePosition: t.queuePosition,
    })

    return NextResponse.json({
      active: active.map(mapThread),
      waiting: waiting.map(mapThread),
      closed: closed.map(mapThread),
    })
  } catch (error) {
    console.error("List threads error:", error)
    return NextResponse.json({ error: "Failed to list threads" }, { status: 500 })
  }
}
