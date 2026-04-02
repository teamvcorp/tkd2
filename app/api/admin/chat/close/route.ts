import { NextRequest, NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/adminAuth"
import { getAdminChatClient } from "@/lib/acs"
import { closeThread } from "@/lib/threadStore"

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { threadId } = await req.json()
    if (!threadId) {
      return NextResponse.json({ error: "threadId is required" }, { status: 400 })
    }

    const closed = await closeThread(threadId)
    if (!closed) {
      return NextResponse.json({ error: "Thread not found or already closed" }, { status: 404 })
    }

    // Send a closing message to the thread so the visitor knows
    try {
      const { chatClient } = await getAdminChatClient()
      const threadClient = chatClient.getChatThreadClient(threadId)
      await threadClient.sendMessage(
        { content: "This chat has been closed by support. Thank you for contacting Taekwondo of Storm Lake!" },
        { senderDisplayName: "Support", type: "text" }
      )
    } catch {
      // Best-effort close message
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Close thread error:", error)
    return NextResponse.json({ error: "Failed to close thread" }, { status: 500 })
  }
}
