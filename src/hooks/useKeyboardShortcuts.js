import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useKeyboardShortcuts({onSearchOpen}) {
    const navigate = useNavigate()

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't fire if user is typing in an input
            if (
                e.target.tagName === 'INPUT' ||
                e.target.tagName === 'TEXTAREA' ||
                e.target.tagName === 'SELECT' ||
                e.target.isContentEditable
            ) return

            // N → New Order
            if (e.key === 'n' || e.key === 'N') {
                e.preventDefault()
                navigate('/orders/create')
            }

            // Ctrl+K → Focus search (we'll build this next)
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault()
                onSearchOpen()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [navigate,onSearchOpen])
}