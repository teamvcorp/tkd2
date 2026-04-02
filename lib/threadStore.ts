import client from "./mongodb"

const DB_NAME = process.env.MONGODB_DATABASE || "tkd"
const COLLECTION = "chatThreads"

const MAX_ACTIVE_CHATS = 10

export type ThreadStatus = "active" | "waiting" | "closed"

export interface ThreadMeta {
  id: string
  topic: string
  visitorName: string
  phone: string
  createdAt: string
  status: ThreadStatus
  queuePosition?: number
}

function getCollection() {
  return client.db(DB_NAME).collection<ThreadMeta>(COLLECTION)
}

export async function getActiveCount(): Promise<number> {
  return getCollection().countDocuments({ status: "active" })
}

export async function getWaitingCount(): Promise<number> {
  return getCollection().countDocuments({ status: "waiting" })
}

export async function addThread(meta: Omit<ThreadMeta, "status" | "queuePosition">): Promise<{ status: ThreadStatus; queuePosition?: number }> {
  const activeCount = await getActiveCount()

  if (activeCount < MAX_ACTIVE_CHATS) {
    await getCollection().insertOne({ ...meta, status: "active" })
    return { status: "active" }
  }

  // Queue the visitor
  const waitingCount = await getWaitingCount()
  const queuePosition = waitingCount + 1
  await getCollection().insertOne({ ...meta, status: "waiting", queuePosition })
  return { status: "waiting", queuePosition }
}

export async function closeThread(threadId: string): Promise<ThreadMeta | null> {
  const result = await getCollection().findOneAndUpdate(
    { id: threadId, status: { $in: ["active", "waiting"] } },
    { $set: { status: "closed" as ThreadStatus } },
    { returnDocument: "after" }
  )

  // If we closed an active thread, promote the next waiting one
  if (result && result.status === "closed") {
    await promoteNextWaiting()
  }

  return result
}

export async function promoteNextWaiting(): Promise<ThreadMeta | null> {
  const activeCount = await getActiveCount()
  if (activeCount >= MAX_ACTIVE_CHATS) return null

  const next = await getCollection().findOneAndUpdate(
    { status: "waiting" },
    { $set: { status: "active" as ThreadStatus }, $unset: { queuePosition: "" } },
    { sort: { createdAt: 1 }, returnDocument: "after" }
  )

  if (next) {
    // Recalculate queue positions for remaining waiting threads
    const waiting = await getCollection()
      .find({ status: "waiting" })
      .sort({ createdAt: 1 })
      .toArray()
    for (let i = 0; i < waiting.length; i++) {
      await getCollection().updateOne(
        { id: waiting[i].id },
        { $set: { queuePosition: i + 1 } }
      )
    }
  }

  return next
}

export async function getThreadById(threadId: string): Promise<ThreadMeta | null> {
  return getCollection().findOne({ id: threadId })
}

export async function getActiveThreads(): Promise<ThreadMeta[]> {
  return getCollection().find({ status: "active" }).sort({ createdAt: -1 }).toArray()
}

export async function getWaitingThreads(): Promise<ThreadMeta[]> {
  return getCollection().find({ status: "waiting" }).sort({ createdAt: 1 }).toArray()
}

export async function getClosedThreads(): Promise<ThreadMeta[]> {
  return getCollection().find({ status: "closed" }).sort({ createdAt: -1 }).toArray()
}

export async function getAllThreads(): Promise<ThreadMeta[]> {
  return getCollection().find().sort({ createdAt: -1 }).toArray()
}
