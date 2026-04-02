import { NextRequest, NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/adminAuth"
import { getAdminChatClient } from "@/lib/acs"

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const threadId = req.nextUrl.searchParams.get("threadId")
  if (!threadId) {
    return NextResponse.json({ error: "threadId is required" }, { status: 400 })
  }

  try {
    const { chatClient } = await getAdminChatClient()
    const threadClient = chatClient.getChatThreadClient(threadId)

    const messages: Array<{
      id: string
      content: string
      senderDisplayName: string
      senderId: string
      createdOn: string
    }> = []

    for await (const message of threadClient.listMessages()) {
      if (message.type === "text" && message.content?.message) {
        messages.push({
          id: message.id,
          content: message.content.message,
          senderDisplayName: message.senderDisplayName || "Unknown",
          senderId: message.sender && "communicationUserId" in message.sender
            ? message.sender.communicationUserId
            : "",
          createdOn: message.createdOn.toISOString(),
        })
      }
    }

    messages.reverse()
    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Admin messages error:", error)
    return NextResponse.json({ error: "Failed to get messages" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { threadId, message } = await req.json()
    if (!threadId || !message) {
      return NextResponse.json({ error: "threadId and message are required" }, { status: 400 })
    }

    const { chatClient } = await getAdminChatClient()
    const threadClient = chatClient.getChatThreadClient(threadId)

    const sendResult = await threadClient.sendMessage(
      { content: message },
      { senderDisplayName: "Support", type: "text" }
    )

    return NextResponse.json({ messageId: sendResult.id })
  } catch (error) {
    console.error("Admin send error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
