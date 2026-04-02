"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface ChatMessage {
  id: string
  content: string
  senderDisplayName: string
  senderId: string
  createdOn: string
}

interface ChatSession {
  threadId: string
  userId: string
  token: string
  name: string
  status: "active" | "waiting" | "closed"
  queuePosition?: number
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [session, setSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [isStarting, setIsStarting] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const statusPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent))
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchMessages = useCallback(async () => {
    if (!session) return
    try {
      const res = await fetch(
        `/api/chat/messages?threadId=${encodeURIComponent(session.threadId)}&token=${encodeURIComponent(session.token)}`
      )
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages)
      }
    } catch { /* silent */ }
  }, [session])

  // Poll for queue status when waiting
  const checkStatus = useCallback(async () => {
    if (!session || session.status !== "waiting") return
    try {
      const res = await fetch(`/api/chat/status?threadId=${encodeURIComponent(session.threadId)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.status === "active") {
          setSession(prev => prev ? { ...prev, status: "active", queuePosition: undefined } : prev)
        } else if (data.status === "waiting") {
          setSession(prev => prev ? { ...prev, queuePosition: data.queuePosition } : prev)
        } else if (data.status === "closed") {
          setSession(prev => prev ? { ...prev, status: "closed" } : prev)
        }
      }
    } catch { /* silent */ }
  }, [session])

  useEffect(() => {
    if (isOpen && session && session.status === "waiting") {
      checkStatus()
      statusPollRef.current = setInterval(checkStatus, 5000)
    }
    return () => {
      if (statusPollRef.current) clearInterval(statusPollRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, session?.status, session?.threadId, checkStatus])

  useEffect(() => {
    if (isOpen && session && session.status === "active") {
      fetchMessages()
      pollRef.current = setInterval(fetchMessages, 4000)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, session?.status, session?.threadId, fetchMessages])

  async function startChat(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return
    setIsStarting(true)
    setError("")
    try {
      const res = await fetch("/api/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      })
      if (!res.ok) throw new Error("Failed to start chat")
      const data = await res.json()
      setSession({
        threadId: data.threadId,
        userId: data.userId,
        token: data.token,
        name: name.trim(),
        status: data.status,
        queuePosition: data.queuePosition,
      })
    } catch {
      setError("Unable to start chat. Please try again.")
    } finally {
      setIsStarting(false)
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !session) return
    const msg = input.trim()
    setInput("")
    setIsSending(true)
    try {
      await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: session.threadId,
          token: session.token,
          message: msg,
          displayName: session.name,
        }),
      })
      await fetchMessages()
    } catch {
      setError("Failed to send. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  if (isMobile) return null

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        aria-label={isOpen ? "Close chat" : "Chat with us"}
        title="Chat with Support"
      >
        {isOpen ? (
          <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-[200] w-[360px] max-h-[520px] flex flex-col rounded-2xl border border-white/10 bg-gray-900 shadow-2xl overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2">
              <span className={`flex size-2 rounded-full ${session?.status === "waiting" ? "bg-yellow-400" : "bg-green-400"} animate-pulse`} />
              <span className="text-sm font-semibold text-white/80">TKD Support</span>
            </div>
            <div className="flex items-center gap-1">
              {session && (
                <button
                  onClick={() => { setSession(null); setMessages([]); setName(""); setPhone(""); setError("") }}
                  className="px-2 py-1 rounded text-[10px] font-semibold text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors"
                  title="End chat session"
                >
                  End Chat
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="p-1 rounded text-white/40 hover:text-white transition-colors">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {!session ? (
            <form onSubmit={startChat} className="flex-1 p-4 space-y-3">
              <p className="text-sm text-white/60 leading-relaxed">
                Chat with our support team. Enter your details to get started.
              </p>
              <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20" />
              <input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20" />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button type="submit" disabled={isStarting}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {isStarting ? "Connecting..." : "Start Chat"}
              </button>
              <p className="text-[10px] text-white/30 leading-relaxed">
                By starting a chat you agree to our <a href="/policy" className="underline hover:text-white/50">Terms &amp; Privacy Policy</a>.
              </p>
            </form>
          ) : session.status === "waiting" ? (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-yellow-500/10">
                <svg className="size-6 text-yellow-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white/80">You&apos;re in the queue</p>
                <p className="mt-1 text-3xl font-bold text-yellow-400">#{session.queuePosition || "—"}</p>
                <p className="mt-1 text-xs text-white/40">in line</p>
              </div>
              <p className="text-xs text-white/50 leading-relaxed max-w-[240px]">
                All support agents are busy. You&apos;ll be connected automatically when it&apos;s your turn.
              </p>
              <div className="flex items-center gap-1.5">
                <span className="flex size-1.5 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-[10px] text-white/30">Checking every few seconds…</span>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px] max-h-[360px]">
                {messages.map((msg) => {
                  const isMe = msg.senderId === session.userId
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                        isMe ? "bg-indigo-600 text-white rounded-br-sm" : "bg-white/10 text-white/80 rounded-bl-sm"
                      }`}>
                        {!isMe && <p className="text-[10px] text-white/40 mb-0.5">{msg.senderDisplayName}</p>}
                        <p className="leading-relaxed">{msg.content}</p>
                        <p className={`text-[9px] mt-1 ${isMe ? "text-white/50" : "text-white/30"}`}>
                          {new Date(msg.createdOn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={sendMessage} className="flex gap-2 p-3 border-t border-white/10">
                <input type="text" placeholder="Type a message..." value={input} onChange={(e) => setInput(e.target.value)}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20" />
                <button type="submit" disabled={isSending || !input.trim()}
                  className="rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </form>
              {error && <p className="px-3 pb-2 text-xs text-red-400">{error}</p>}
            </>
          )}
        </div>
      )}
    </>
  )
}
