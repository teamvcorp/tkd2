import { NextRequest, NextResponse } from "next/server"
import { ACS_ENDPOINT } from "@/lib/acs"
import { ChatClient } from "@azure/communication-chat"
import { AzureCommunicationTokenCredential } from "@azure/communication-common"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const threadId = searchParams.get("threadId")
    const token = searchParams.get("token")

    if (!threadId || !token) {
      return NextResponse.json({ error: "threadId and token are required" }, { status: 400 })
    }

    const credential = new AzureCommunicationTokenCredential(token)
    const chatClient = new ChatClient(ACS_ENDPOINT, credential)
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
    console.error("Chat messages error:", error)
    return NextResponse.json({ error: "Failed to get messages" }, { status: 500 })
  }
}
