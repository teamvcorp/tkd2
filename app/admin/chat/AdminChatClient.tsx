'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ChatThread {
  id: string
  topic: string
  visitorName: string
  lastMessageReceivedOn: string | null
  status: string
  queuePosition?: number
}

interface ChatMessage {
  id: string
  content: string
  senderDisplayName: string
  senderId: string
  createdOn: string
}

type TabKey = 'active' | 'waiting' | 'closed'

export default function AdminChatClient() {
  const router = useRouter()
  const [activeThreads, setActiveThreads] = useState<ChatThread[]>([])
  const [waitingThreads, setWaitingThreads] = useState<ChatThread[]>([])
  const [closedThreads, setClosedThreads] = useState<ChatThread[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedThreadId, setSelectedThreadId] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [closing, setClosing] = useState(false)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<TabKey>('active')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const threadPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/chat/threads', { cache: 'no-store' })
      const data = await res.json()
      setActiveThreads(data.active || [])
      setWaitingThreads(data.waiting || [])
      setClosedThreads(data.closed || [])
    } catch {
      setActiveThreads([])
      setWaitingThreads([])
      setClosedThreads([])
    }
  }, [])

  useEffect(() => {
    fetchThreads().finally(() => setLoading(false))
    threadPollRef.current = setInterval(fetchThreads, 8000)
    return () => { if (threadPollRef.current) clearInterval(threadPollRef.current) }
  }, [fetchThreads])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = useCallback(async () => {
    if (!selectedThreadId) return
    try {
      const res = await fetch(`/api/admin/chat/messages?threadId=${encodeURIComponent(selectedThreadId)}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch { /* silent */ }
  }, [selectedThreadId])

  useEffect(() => {
    if (selectedThreadId) {
      setLoadingMessages(true)
      fetchMessages().finally(() => setLoadingMessages(false))
      pollRef.current = setInterval(fetchMessages, 5000)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [selectedThreadId, fetchMessages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !selectedThreadId) return
    const msg = input.trim()
    setInput('')
    setSending(true)
    try {
      await fetch('/api/admin/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: selectedThreadId, message: msg }),
      })
      await fetchMessages()
    } catch { /* silent */ }
    finally { setSending(false) }
  }

  async function handleClose() {
    if (!selectedThreadId) return
    setClosing(true)
    try {
      await fetch('/api/admin/chat/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: selectedThreadId }),
      })
      setSelectedThreadId('')
      setMessages([])
      await fetchThreads()
    } catch { /* silent */ }
    finally { setClosing(false) }
  }

  async function onLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.replace('/admin')
    router.refresh()
  }

  const threadsByTab: Record<TabKey, ChatThread[]> = {
    active: activeThreads,
    waiting: waitingThreads,
    closed: closedThreads,
  }
  const currentThreads = threadsByTab[tab].filter((t) =>
    t.topic.toLowerCase().includes(search.toLowerCase())
  )
  const allThreads = [...activeThreads, ...waitingThreads, ...closedThreads]
  const selectedThread = allThreads.find((t) => t.id === selectedThreadId)

  const SUPPORT_DISPLAY_NAME = "Support"

  const tabConfig: { key: TabKey; label: string; count: number; color: string }[] = [
    { key: 'active', label: 'Active', count: activeThreads.length, color: 'bg-green-500' },
    { key: 'waiting', label: 'Waiting', count: waitingThreads.length, color: 'bg-yellow-500' },
    { key: 'closed', label: 'Closed', count: closedThreads.length, color: 'bg-gray-400' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Support Chat</h1>
            <p className="mt-2 text-sm text-gray-500">Reply to visitor support chats. Max 10 active — extras queue automatically.</p>
            <div className="mt-1 flex gap-4 text-xs text-gray-400">
              <span>Active: <span className="font-semibold text-green-600">{activeThreads.length}/10</span></span>
              <span>Waiting: <span className="font-semibold text-yellow-600">{waitingThreads.length}</span></span>
              <span>Closed: <span className="font-semibold text-gray-500">{closedThreads.length}</span></span>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/admin" className="rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">Dashboard</Link>
            <button onClick={onLogout} className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100">Logout</button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading chats…</p>
        ) : allThreads.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
            <p className="text-sm text-gray-500">No support chats yet.</p>
            <p className="mt-1 text-xs text-gray-400">Chats will appear here when visitors start a conversation.</p>
          </div>
        ) : (
          <div className="flex gap-6 h-[calc(100vh-240px)]">
            {/* Thread list sidebar */}
            <div className="w-80 shrink-0 flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-gray-100">
                {tabConfig.map(({ key, label, count, color }) => (
                  <button key={key} onClick={() => { setTab(key); setSelectedThreadId('') }}
                    className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                      tab === key ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                    }`}>
                    <span className="flex items-center justify-center gap-1.5">
                      <span className={`inline-block size-1.5 rounded-full ${color}`} />
                      {label}
                      <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">{count}</span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="p-3 border-b border-gray-100">
                <input type="text" placeholder="Search chats…" value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:border-indigo-300" />
              </div>
              <div className="flex-1 overflow-y-auto">
                {currentThreads.length === 0 ? (
                  <p className="p-4 text-xs text-gray-400 text-center">No {tab} chats.</p>
                ) : currentThreads.map((thread) => (
                  <button key={thread.id} onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-indigo-50 transition-colors ${
                      thread.id === selectedThreadId ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''
                    }`}>
                    <div className="flex items-center gap-2">
                      <span className={`flex size-1.5 rounded-full ${
                        thread.status === 'active' ? 'bg-green-400' : thread.status === 'waiting' ? 'bg-yellow-400' : 'bg-gray-300'
                      }`} />
                      <p className="text-sm font-semibold text-gray-900 truncate">{thread.topic.replace('Support: ', '')}</p>
                    </div>
                    <div className="flex items-center justify-between mt-0.5 pl-3.5">
                      {thread.queuePosition && (
                        <span className="text-[10px] font-semibold text-yellow-600">#{thread.queuePosition} in line</span>
                      )}
                      {thread.lastMessageReceivedOn && (
                        <p className="text-xs text-gray-400">
                          {new Date(thread.lastMessageReceivedOn).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className={`flex size-2 rounded-full ${
                    selectedThread?.status === 'active' ? 'bg-green-400' : selectedThread?.status === 'waiting' ? 'bg-yellow-400' : 'bg-gray-300'
                  }`} />
                  <span className="text-sm font-semibold text-gray-900">{selectedThread?.topic.replace('Support: ', '') || 'Select a chat'}</span>
                  {selectedThread && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      selectedThread.status === 'active' ? 'bg-green-100 text-green-700' :
                      selectedThread.status === 'waiting' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>{selectedThread.status}</span>
                  )}
                </div>
                {selectedThread && selectedThread.status !== 'closed' && (
                  <button onClick={handleClose} disabled={closing}
                    className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors">
                    {closing ? 'Closing…' : 'Close Chat'}
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {!selectedThreadId ? (
                  <p className="text-sm text-gray-400 text-center py-8">Select a chat from the sidebar.</p>
                ) : loadingMessages ? (
                  <p className="text-sm text-gray-400 text-center py-8">Loading messages…</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No messages yet.</p>
                ) : (
                  messages.map((msg) => {
                    const isSupport = msg.senderDisplayName === SUPPORT_DISPLAY_NAME
                    return (
                      <div key={msg.id} className={`flex ${isSupport ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                          isSupport ? 'bg-indigo-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}>
                          {!isSupport && <p className="text-[10px] font-semibold mb-0.5 text-gray-500">{msg.senderDisplayName}</p>}
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${isSupport ? 'text-indigo-200' : 'text-gray-400'}`}>
                            {new Date(msg.createdOn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {selectedThread && selectedThread.status !== 'closed' && (
                <form onSubmit={sendMessage} className="flex gap-3 p-4 border-t border-gray-100 bg-gray-50">
                  <input type="text" placeholder="Type a reply…" value={input} onChange={(e) => setInput(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-indigo-300" />
                  <button type="submit" disabled={sending || !input.trim()}
                    className="rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-40 transition-colors">
                    {sending ? 'Sending…' : 'Send'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
