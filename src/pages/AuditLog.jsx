import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import AuditLogDrawer from '../components/AuditLogDrawer'
import { useToast } from '../hooks/useToast'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { typeStyles, getInitials, formatDateTime, groupByDay } from '@/lib/auditLog'

const sourcePills = [
    { value: 'all', label: 'All' },
    { value: 'ledger', label: 'Money' },
    { value: 'inventory', label: 'Stock' },
    { value: 'audit', label: 'Edits' },
]

export default function AuditLog() {
    const [source, setSource] = useState('')
    const [page, setPage] = useState(1)
    const [selectedRow, setSelectedRow] = useState(null)
    const { showToast } = useToast()

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['audit-log', { source, page }],
        queryFn: () =>
            api
                .get('/audit-log', { params: { source: source || undefined, page } })
                .then((res) => res.data),
    })

    useEffect(() => {
        if (isError) {
            showToast(error?.response?.data?.message || 'Failed to load activity', 'error')
        }
    }, [isError, error, showToast])

    const rows = data?.data || []
    const lastPage = data?.meta?.last_page || 1
    const groups = groupByDay(rows)

    const handleSourceChange = (value) => {
        if (!value) return 
        setSource(value === 'all' ? '' : value)
        setPage(1)
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h2 className="text-2xl font-bold text-white">Activity</h2>

                <ToggleGroup
                    type="single"
                    size="sm"
                    value={source || 'all'}
                    onValueChange={handleSourceChange}
                    className="bg-gray-900 border border-gray-800 rounded-lg p-1"
                >
                    {sourcePills.map((pill) => (
                        <ToggleGroupItem key={pill.value} value={pill.value}>
                            {pill.label}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            </div>

            {isLoading && <LoadingSpinner />}

            {!isLoading && groups.length === 0 && (
                <div className="text-center py-16 text-gray-500 bg-gray-900 border border-gray-800 rounded-xl">
                    No activity found.
                </div>
            )}

            {!isLoading && (
            <div className="space-y-6">
                {groups.map((group) => (
                    <div key={group.label}>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            {group.label}
                        </h3>
                        <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
                            {group.rows.map((row) => (
                                <button
                                    key={`${row.source}-${row.id}`}
                                    onClick={() => setSelectedRow(row)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-start hover:bg-gray-800/50 transition-colors"
                                >
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarFallback>{getInitials(row.user_name)}</AvatarFallback>
                                    </Avatar>

                                    <Badge className={typeStyles[row.type] || 'bg-gray-700 text-gray-300'}>
                                        {row.type}
                                    </Badge>

                                    <span className="flex-1 text-sm text-white truncate">
                                        {row.user_name && (
                                            <span className="text-gray-400 font-medium">{row.user_name}</span>
                                        )}
                                        {row.user_name && row.description && <span className="text-gray-600"> — </span>}
                                        {row.description || (!row.user_name && '—')}
                                    </span>

                                    {row.amount !== null && (
                                        <span className="text-sm font-medium text-white shrink-0">{row.amount} EGP</span>
                                    )}
                                    {row.quantity !== null && (
                                        <span className="text-sm font-medium text-white shrink-0">{row.quantity} units</span>
                                    )}

                                    <span className="text-xs text-gray-500 shrink-0">{formatDateTime(row.created_at)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            )}

            {!isLoading && lastPage > 1 && (
                <div className="flex justify-between items-center mt-4">
                    <button
                        onClick={() => setPage((p) => p - 1)}
                        disabled={page === 1}
                        className="px-4 py-2 bg-gray-800 text-gray-400 text-sm rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors"
                    >
                        ← Previous
                    </button>
                    <span className="text-gray-400 text-sm">Page {page} of {lastPage}</span>
                    <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page === lastPage}
                        className="px-4 py-2 bg-gray-800 text-gray-400 text-sm rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors"
                    >
                        Next →
                    </button>
                </div>
            )}

            <AuditLogDrawer row={selectedRow} onClose={() => setSelectedRow(null)} />
        </div>
    )
}
