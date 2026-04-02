import { NextRequest, NextResponse } from "next/server"
import { getIdentityClient, getAdminChatClient, ACS_ENDPOINT } from "@/lib/acs"
import { addThread } from "@/lib/threadStore"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { name, phone } = await req.json()

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 })
    }

    // Create visitor identity + token
    const identityClient = getIdentityClient()
    const { user: visitor, token: visitorToken } = await identityClient.createUserAndToken(["chat"])

    // Get persistent admin chat client
    const { chatClient: adminChat, user: adminUser } = await getAdminChatClient()

    // Create chat thread with both participants
    const createResult = await adminChat.createChatThread(
      { topic: `Support: ${name}` },
      {
        participants: [
          { id: adminUser, displayName: "Support" },
          { id: visitor, displayName: name },
        ],
      }
    )

    const threadId = createResult.chatThread?.id
    if (!threadId) {
      return NextResponse.json({ error: "Failed to create chat thread" }, { status: 500 })
    }

    // Persist thread metadata to MongoDB (handles active vs waiting)
    const { status, queuePosition } = await addThread({
      id: threadId,
      topic: `Support: ${name}`,
      visitorName: name,
      phone,
      createdAt: new Date().toISOString(),
    })

    // Send welcome message based on status
    const threadClient = adminChat.getChatThreadClient(threadId)
    if (status === "active") {
      await threadClient.sendMessage(
        { content: `Hi ${name}! Welcome to Taekwondo of Storm Lake support. How can we help you today?` },
        { senderDisplayName: "Support", type: "text" }
      )
    } else {
      await threadClient.sendMessage(
        { content: `Hi ${name}! All of our support agents are currently busy. You are #${queuePosition} in line. We'll be with you shortly!` },
        { senderDisplayName: "Support", type: "text" }
      )
    }

    // Email notification (best-effort)
    try {
      await resend.emails.send({
        from: process.env.FROM_EMAIL || "tkdorder@fyht4.com",
        to: process.env.APPLICATION_EMAIL || "admin@thevacorp.com",
        subject: `New Support Chat: ${name}`,
        html: `
          <h2>New support chat started</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Status:</strong> ${status}${queuePosition ? ` (#${queuePosition} in queue)` : ''}</p>
          <p><strong>Thread ID:</strong> ${threadId}</p>
          <p>Reply through the admin chat interface.</p>
        `,
      })
    } catch {
      // Email notification is best-effort
    }

    return NextResponse.json({
      threadId,
      userId: visitor.communicationUserId,
      token: visitorToken,
      endpoint: ACS_ENDPOINT,
      status,
      queuePosition,
    })
  } catch (error) {
    console.error("Chat start error:", error)
    return NextResponse.json({ error: "Failed to start chat" }, { status: 500 })
  }
}
