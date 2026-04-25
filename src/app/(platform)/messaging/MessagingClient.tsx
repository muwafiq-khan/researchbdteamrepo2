"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type UserInfo = {
  id: string
  displayName: string
  avatarUrl: string | null
  email: string
}

type Thread = {
  user: UserInfo
  lastMessage: string | null
  lastMessageTime: string | null
  unreadCount: number
}

type Message = {
  id: string
  senderId: string
  receiverId: string
  content: string
  isRead: boolean
  createdAt: string
}

type Props = {
  initialThreads: Thread[]
  currentUserId: string
}

export default function MessagingClient({ initialThreads, currentUserId }: Props) {
  const router = useRouter()
  const [threads, setThreads] = useState<Thread[]>(initialThreads)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch threads when initialThreads updates from server (like after a refresh)
  useEffect(() => {
    setThreads(initialThreads)
  }, [initialThreads])

  // Select a user to chat with
  const handleSelectThread = async (userId: string) => {
    setSelectedUserId(userId)
    setIsLoadingHistory(true)
    try {
      const res = await fetch(`/api/messages?otherUserId=${userId}`)
      const data = await res.json()
      if (data.messages) {
        setMessages(data.messages)
        
        // Mark locally as read
        setThreads(prev => prev.map(t => 
          t.user.id === userId ? { ...t, unreadCount: 0 } : t
        ))
        
        // Refresh server props in background
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to load messages', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Send a message
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!selectedUserId || !newMessage.trim()) return

    const contentToSend = newMessage.trim()
    setNewMessage('')

    // Optimistic UI update
    const tempMsg: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      receiverId: selectedUserId,
      content: contentToSend,
      isRead: false,
      createdAt: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempMsg])
    
    // Update thread preview optimistically
    setThreads(prev => {
      const newThreads = prev.map(t => {
        if (t.user.id === selectedUserId) {
          return {
            ...t,
            lastMessage: contentToSend,
            lastMessageTime: tempMsg.createdAt
          }
        }
        return t
      })
      // sort again
      return newThreads.sort((a, b) => {
        if (!a.lastMessageTime) return 1
        if (!b.lastMessageTime) return -1
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      })
    })

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: selectedUserId, content: contentToSend })
      })
      const data = await res.json()
      if (data.message) {
        // Swap temp with real if needed, or just let it be since it's accurate enough
        // router.refresh() 
      }
    } catch (error) {
      console.error('Failed to send message', error)
      // It might be good to revert optimistic UI on failure, but keeping it simple
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  const activeThread = threads.find(t => t.user.id === selectedUserId)

  return (
    <div className="flex flex-col gap-6 h-full w-full">
      {/* Top - Acquaintances List */}
      <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col shadow-xl overflow-hidden min-h-[200px] max-h-[350px] shrink-0">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950">
          <h2 className="text-lg font-bold text-white">Acquaintances</h2>
        </div>
        <div className="flex-1 overflow-y-auto bg-zinc-900/50">
          {threads.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              You don't have any acquaintances yet. Go to the Acquaintances page to find friends!
            </div>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.user.id}
                onClick={() => handleSelectThread(thread.user.id)}
                className={`w-full text-left p-4 border-b border-zinc-800/50 hover:bg-zinc-800 transition-colors flex items-center gap-3 ${
                  selectedUserId === thread.user.id ? 'bg-zinc-800' : ''
                }`}
              >
                <div 
                  className="relative shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/profile/${thread.user.id}`)
                  }}
                >
                  {thread.user.avatarUrl ? (
                    <img src={thread.user.avatarUrl} alt={thread.user.displayName} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-white text-lg">
                      {thread.user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {thread.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-zinc-900">
                      {thread.unreadCount > 99 ? '99+' : thread.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-bold truncate">{thread.user.displayName}</h4>
                  <span className="text-zinc-500 text-[11px] truncate block mb-1">{thread.user.email}</span>
                  <p className={`text-sm truncate ${thread.unreadCount > 0 ? 'text-white font-medium' : 'text-zinc-400'}`}>
                    {thread.lastMessage || 'No messages yet...'}
                  </p>
                </div>
                <div className="shrink-0 hidden lg:block">
                  <span className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                    Message
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden min-h-[400px]">
        {!selectedUserId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8 text-center">
            <span className="text-5xl mb-4">💬</span>
            <h3 className="text-xl font-bold text-white mb-2">Your Messages</h3>
            <p>Select an acquaintance from the list to start messaging.</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex items-center gap-4 shrink-0">
              <button 
                className="md:hidden text-zinc-400 hover:text-white"
                onClick={() => setSelectedUserId(null)}
              >
                ← Back
              </button>
              <Link href={`/profile/${activeThread?.user.id}`} className="hover:opacity-80 transition-opacity">
                {activeThread?.user.avatarUrl ? (
                  <img src={activeThread.user.avatarUrl} className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-white text-sm shrink-0">
                    {activeThread?.user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
              <Link href={`/profile/${activeThread?.user.id}`} className="hover:underline truncate">
                <h2 className="text-lg font-bold text-white truncate">{activeThread?.user.displayName}</h2>
              </Link>
            </div>
            
            {/* Messages history */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center h-full text-zinc-500">
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-sm">
                  Say hi to start the conversation!
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMine = msg.senderId === currentUserId;
                  
                  // Simple formatted date/time
                  const dateObj = new Date(msg.createdAt)
                  const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <div 
                        className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2 text-white ${
                          isMine 
                            ? 'bg-blue-600 rounded-br-sm' 
                            : 'bg-zinc-800 rounded-bl-sm'
                        }`}
                      >
                        <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <span className="text-[10px] text-zinc-500 mt-1 mx-1">
                        {timeString}
                      </span>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900 shrink-0">
              <form onSubmit={handleSend} className="flex gap-2 relative">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-full px-5 py-3 pr-16 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white rounded-full p-2 h-9 w-9 flex items-center justify-center hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:hover:bg-blue-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 translate-x-px">
                     <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                  </svg>
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
