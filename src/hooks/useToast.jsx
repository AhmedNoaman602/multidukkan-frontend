import { createContext, useContext, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
    const [toast, setToast] = useState({ message: '', type: 'error' })

    const showToast = (message, type = 'error') => {
        setToast({ message, type })
    }

    const hideToast = () => {
        setToast({ message: '', type: 'error' })
    }

    return (
        <ToastContext.Provider value={{ showToast, hideToast, toast }}>
            {children}
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    return context
}