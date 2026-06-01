import { useEffect } from 'react'
import { useToast } from '../hooks/useToast'

export default function Toast() {
    const { toast, hideToast } = useToast()

    useEffect(() => {
        if (!toast.message) return
        const timer = setTimeout(hideToast, 4000)
        return () => clearTimeout(timer)
    }, [toast.message])

    if (!toast.message) return null

    const styles = {
        error:   'bg-red-500/10 border-red-500/20 text-red-400',
        success: 'bg-green-500/10 border-green-500/20 text-green-400',
        info:    'bg-blue-500/10 border-blue-500/20 text-blue-400',
    }

    return (
        <div className={`fixed bottom-6 left-6 z-50 px-4 py-3 rounded-lg border text-sm shadow-lg max-w-sm ${styles[toast.type]}`}>
            <div className="flex items-center justify-between gap-3">
                <span>{toast.message}</span>
                <button
                    onClick={hideToast}
                    className="text-current opacity-60 hover:opacity-100 transition-opacity"
                >
                    ✕
                </button>
            </div>
        </div>
    )
}