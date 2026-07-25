import { useState, useEffect } from 'react'
import api from '../api/axios'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { typeStyles, humanizeField, getInitials, formatDateTime } from '@/lib/auditLog'

export default function AuditLogDrawer({ row, onClose }) {
  const [batchItems, setBatchItems] = useState(null)
  const [loadingBatch, setLoadingBatch] = useState(false)

  const isBatch = row?.source === 'inventory' && row?.batch_id && row?.item_count > 1

  useEffect(() => {
    if (!isBatch) {
      setBatchItems(null)
      return
    }
    setLoadingBatch(true)
    api.get(`/audit-log/inventory-batches/${row.batch_id}`)
      .then(res => setBatchItems(res.data.data))
      .catch(() => setBatchItems([]))
      .finally(() => setLoadingBatch(false))
  }, [row?.batch_id, isBatch])

  const entityLabel =
    row?.entity_name || row?.product_name || row?.customer_name || row?.supplier_name || row?.warehouse_name

  return (
    <Sheet open={!!row} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="left" className="w-full sm:max-w-lg overflow-y-auto">
        {row && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <Badge className={typeStyles[row.type] || 'bg-gray-700 text-gray-300'}>
                  {row.type}
                </Badge>
                <span className="text-xs text-muted-foreground">{formatDateTime(row.created_at)}</span>
              </div>
              <SheetTitle>{entityLabel || row.auditable_type || 'Activity'}</SheetTitle>
              {row.auditable_type && <SheetDescription>{row.auditable_type}</SheetDescription>}
            </SheetHeader>

            <div className="flex items-center gap-2 mt-4">
              <Avatar className="h-7 w-7">
                <AvatarFallback>{getInitials(row.user_name)}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-foreground">{row.user_name || 'System'}</span>
            </div>

            <div className="mt-6">
              {row.changes ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field</TableHead>
                      <TableHead>Previous</TableHead>
                      <TableHead>New</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(row.changes).map(([field, [oldValue, newValue]]) => (
                      <TableRow key={field}>
                        <TableCell className="font-medium">{humanizeField(field)}</TableCell>
                        <TableCell className="text-muted-foreground">{String(oldValue ?? '—')}</TableCell>
                        <TableCell>{String(newValue ?? '—')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : isBatch ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {row.item_count} products — {row.quantity} units total
                  </p>
                  {loadingBatch ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Warehouse</TableHead>
                          <TableHead>Quantity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(batchItems || []).map((item, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{item.product_name}</TableCell>
                            <TableCell className="text-muted-foreground">{item.warehouse_name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <p className="text-foreground">{row.description || 'No description available.'}</p>
                  {row.amount !== null && (
                    <p className="text-muted-foreground">
                      Amount: <span className="text-foreground">{row.amount} EGP</span>
                    </p>
                  )}
                  {row.quantity !== null && (
                    <p className="text-muted-foreground">
                      Quantity: <span className="text-foreground">{row.quantity}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
