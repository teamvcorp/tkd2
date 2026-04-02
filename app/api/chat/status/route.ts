import { NextRequest, NextResponse } from "next/server"
import { getThreadById } from "@/lib/threadStore"

export async function GET(req: NextRequest) {
  const threadId = req.nextUrl.searchParams.get("threadId")
  if (!threadId) {
    return NextResponse.json({ error: "threadId is required" }, { status: 400 })
  }

  try {
    const thread = await getThreadById(threadId)
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    return NextResponse.json({
      status: thread.status,
      queuePosition: thread.queuePosition,
    })
  } catch (error) {
    console.error("Chat status error:", error)
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 })
  }
}
