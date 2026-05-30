import { useState, useRef, useEffect } from 'react'
import api from '../api/axios'

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
            setError(err.response?.data?.message || 'Failed to get response.')
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
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 50 }}>

            {/* Chat panel */}
            {open && (
                <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-xl flex flex-col"
                    style={{ width: '340px', height: '480px', marginBottom: '12px' }}>

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-400" />
                            <span className="text-white text-sm font-medium">مساعد المتجر</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {history.length > 0 && (
                                <button
                                    onClick={clearChat}
                                    className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
                                >
                                    مسح
                                </button>
                            )}
                            <button
                                onClick={() => setOpen(false)}
                                className="text-gray-500 hover:text-gray-300 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" dir="rtl">
                        {history.length === 0 && !loading && (
                            <div className="text-center text-gray-500 text-sm mt-8">
                                <p>اسأل عن المنتجات والأسعار والمخزون</p>
                            </div>
                        )}

                        {history.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                            >
                                <div
                                    className={`px-3 py-2 rounded-xl text-sm max-w-[80%] leading-relaxed ${
                                        msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-sm'
                                            : 'bg-gray-800 text-gray-100 rounded-tl-sm'
                                    }`}
                                    style={{ whiteSpace: 'pre-wrap' }}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-end">
                                <div className="bg-gray-800 px-3 py-2 rounded-xl rounded-tl-sm">
                                    <div className="flex gap-1 items-center h-4">
                                        {[0, 1, 2].map(i => (
                                            <div
                                                key={i}
                                                className="w-1.5 h-1.5 rounded-full bg-gray-400"
                                                style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <p className="text-red-400 text-xs text-center">{error}</p>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="px-3 py-3 border-t border-gray-800">
                        <div className="flex gap-2 items-end">
                            <textarea
                                ref={inputRef}
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="اكتب سؤالك..."
                                rows={1}
                                dir="rtl"
                                disabled={loading}
                                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm resize-none focus:outline-none focus:border-blue-500 placeholder-gray-500 disabled:opacity-50"
                                style={{ maxHeight: '80px' }}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!message.trim() || loading}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-sm transition-colors shrink-0"
                            >
                                إرسال
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
                    className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors flex items-center justify-center text-xl"
                >
                    {open ? '✕' : '💬'}
                </button>
            </div>

            <style>{`
                @keyframes bounce {
                    0%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-4px); }
                }
            `}</style>
        </div>
    )
}