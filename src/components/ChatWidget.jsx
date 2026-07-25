import { useState, useRef, useEffect } from 'react'
import api from '../api/axios'
import { MessageCircle, X, Send, Trash2, Bot, Sparkles } from 'lucide-react'

export default function ChatWidget() {
    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const bottomRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
        if (open && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [open])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [history, loading])

    const sendMessage = async () => {
        if (!message.trim() || loading) return
        const userMessage = message.trim()
        setMessage('')
        setError('')

        const optimisticHistory = [...history, { role: 'user', content: userMessage }]
        setHistory(optimisticHistory)
        setLoading(true)

        try {
            const res = await api.post('/ai/chat', {
                message: userMessage,
                history,
            })
            setHistory(res.data.history)
        } catch (err) {
            setError(err.response?.data?.message || 'حصلت مشكلة في الرد.')
            setHistory(history)
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const clearChat = () => {
        setHistory([])
        setError('')
    }

    return (
        <div style={{ position: 'fixed', bottom: '24px', insetInlineEnd: '24px', zIndex: 50 }}>

            {/* Chat panel */}
            {open && (
                <div
                    className="bg-gray-900 border border-purple-500/20 rounded-2xl shadow-2xl shadow-purple-950/40 flex flex-col overflow-hidden"
                    style={{ width: '340px', height: '480px', marginBottom: '12px', animation: 'chat-pop 0.18s ease-out' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gradient-to-l from-purple-600/10 to-transparent">
                        <div className="flex items-center gap-2.5">
                            <span className="relative flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 shrink-0">
                                <Bot size={16} strokeWidth={1.75} />
                                <span className="absolute -bottom-0.5 -start-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-gray-900" />
                            </span>
                            <div className="leading-tight">
                                <p className="text-white text-sm font-medium">مساعد المتجر</p>
                                <p className="text-gray-500 text-[10px]">متصل الآن</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {history.length > 0 && (
                                <button
                                    onClick={clearChat}
                                    title="مسح المحادثة"
                                    className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <Trash2 size={14} strokeWidth={1.75} />
                                </button>
                            )}
                            <button
                                onClick={() => setOpen(false)}
                                className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <X size={15} strokeWidth={1.75} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                        {history.length === 0 && !loading && (
                            <div className="text-center mt-8">
                                <div className="w-11 h-11 mx-auto mb-3 flex items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
                                    <Sparkles size={18} strokeWidth={1.75} />
                                </div>
                                <p className="text-gray-300 text-sm font-medium mb-1">اسأل مساعدك الذكي</p>
                                <p className="text-gray-600 text-xs">عن المنتجات والأسعار والمخزون</p>
                            </div>
                        )}

                        {history.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                            >
                                {msg.role !== 'user' && (
                                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-purple-500/15 text-purple-400 shrink-0">
                                        <Bot size={12} strokeWidth={1.75} />
                                    </span>
                                )}
                                <div
                                    className={`px-3 py-2 rounded-2xl text-sm max-w-[78%] leading-relaxed shadow-sm ${
                                        msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-es-md'
                                            : 'bg-gray-800 text-gray-100 rounded-ee-md'
                                    }`}
                                    style={{ whiteSpace: 'pre-wrap' }}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex items-end gap-2 justify-end">
                                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-purple-500/15 text-purple-400 shrink-0">
                                    <Bot size={12} strokeWidth={1.75} />
                                </span>
                                <div className="bg-gray-800 px-3 py-2.5 rounded-2xl rounded-ee-md">
                                    <div className="flex gap-1 items-center h-3">
                                        {[0, 1, 2].map(i => (
                                            <div
                                                key={i}
                                                className="w-1.5 h-1.5 rounded-full bg-purple-400"
                                                style={{ animation: `chat-bounce 1.2s ease-in-out ${i * 0.15}s infinite` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <p className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 rounded-lg py-2 px-3">{error}</p>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="px-3 py-3 border-t border-gray-800 bg-gray-900/60">
                        <div className="flex gap-2 items-end">
                            <textarea
                                ref={inputRef}
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="اكتب سؤالك..."
                                rows={1}
                                disabled={loading}
                                className="flex-1 px-3.5 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-xl text-sm resize-none focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 placeholder-gray-500 disabled:opacity-50 transition-colors"
                                style={{ maxHeight: '80px' }}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!message.trim() || loading}
                                title="إرسال"
                                className="w-10 h-10 flex items-center justify-center bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white rounded-xl transition-colors shrink-0"
                            >
                                <Send size={16} strokeWidth={1.75} />
                            </button>
                        </div>
                        <p className="text-gray-600 text-[10px] mt-1.5 text-center">Enter للإرسال</p>
                    </div>
                </div>
            )}

            {/* Toggle button */}
            <div className="flex justify-end">
                <button
                    onClick={() => setOpen(prev => !prev)}
                    className="relative w-14 h-14 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-lg shadow-purple-950/50 transition-colors flex items-center justify-center"
                >
                    {!open && (
                        <span className="absolute inset-0 rounded-full bg-purple-500/60 animate-ping" style={{ animationDuration: '2.5s' }} />
                    )}
                    <span className="relative flex items-center justify-center">
                        {open ? <X size={22} strokeWidth={1.75} /> : <MessageCircle size={22} strokeWidth={1.75} />}
                    </span>
                </button>
            </div>

            <style>{`
                @keyframes chat-bounce {
                    0%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-4px); }
                }
                @keyframes chat-pop {
                    from { opacity: 0; transform: translateY(8px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    )
}
