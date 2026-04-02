import { NextRequest, NextResponse } from "next/server"
import { ACS_ENDPOINT } from "@/lib/acs"
import { ChatClient } from "@azure/communication-chat"
import { AzureCommunicationTokenCredential } from "@azure/communication-common"

export async function POST(req: NextRequest) {
  try {
    const { threadId, token, message, displayName } = await req.json()

    if (!threadId || !token || !message) {
      return NextResponse.json({ error: "threadId, token, and message are required" }, { status: 400 })
    }

    const credential = new AzureCommunicationTokenCredential(token)
    const chatClient = new ChatClient(ACS_ENDPOINT, credential)
    const threadClient = chatClient.getChatThreadClient(threadId)

    const sendResult = await threadClient.sendMessage(
      { content: message },
      { senderDisplayName: displayName || "Visitor", type: "text" }
    )

    return NextResponse.json({ messageId: sendResult.id })
  } catch (error) {
    console.error("Chat send error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
