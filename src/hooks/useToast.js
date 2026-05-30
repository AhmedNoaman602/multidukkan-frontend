import { useState } from 'react'

export function useToast() {
    const [toast, setToast] = useState({ message: '', type: 'error' })

    const showToast = (message, type = 'error') => {
        setToast({ message, type })
    }

    const hideToast = () => {
        setToast({ message: '', type: 'error' })
    }

    return { toast, showToast, hideToast }
}