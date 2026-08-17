import { useState, useEffect } from 'react'
import api from '../api/axios'
import {Sheet,SheetContent,SheetHeader,SheetTitle,SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,TableHeader,TableBody,TableRow,TableHead,TableCell,
} from '@/components/ui/table'
import { useTranslation } from '../i18n/useTranslation'
import { formatDateTime, formatNumber } from '../lib/format'
import { typeStyles, humanizeField, getInitials, formatRelativeTime } from '@/lib/auditLog'

// Small uppercase eyebrow + colored 4px bar, used to open every section —
// mirrors the approved prototype's section-tag motif.
function SectionLabel({ label, barClassName, children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className={`w-1 h-3.5 rounded-full shrink-0 ${barClassName}`} />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</span>
      <div className="flex-1" />
      {children}
    </div>
  )
}

const signed = (n) => (Number(n) > 0 ? '+' : '') + formatNumber(n)
const qtyColorClass = (n) => {
  const num = Number(n)
  if (num > 0) return 'text-green-400'
  if (num < 0) return 'text-red-400'
  return 'text-white'
}

// Only ever rendered once `row` is present — keeps every `row.*` access
// below unguarded while the outer Sheet/SheetContent stay permanently
// mounted so Radix can still play the close animation.
function DrawerBody({ row, isBatch, batchItems, loadingBatch }) {
  const { t, lang, dir } = useTranslation()

  const entityLabel =
    row.entity_name || row.product_name || row.customer_name || row.supplier_name || row.warehouse_name

  // Same tint/border/text family as the type Badge, reused for the hero
  // accent bar so both stay visually tied to the event's own category.
  const badgeClass = typeStyles[row.type] || 'bg-gray-700 text-gray-300'
  const typeColorClass = badgeClass.split(' ').find(c => c.startsWith('text-')) || 'text-gray-400'
  const typeAccentClass = typeColorClass.replace('text-', 'bg-').replace(/-\d+$/, '-500')

  const hasAmount = row.amount !== null
  const hasQuantity = row.quantity !== null && !isBatch
  const changedCount = row.changes ? Object.keys(row.changes).length : 0

  let heroValue = null
  let heroCaption = ''
  let heroTextClass = 'text-white'
  if (row.changes) {
    heroValue = t('auditLog.detail.fieldsChanged', { count: changedCount })
    heroCaption = t('auditLog.detail.recordUpdated')
  } else if (isBatch) {
    heroValue = signed(row.quantity)
    heroCaption = t('auditLog.detail.batchSummary', { products: row.item_count, quantity: row.quantity })
    heroTextClass = qtyColorClass(row.quantity)
  } else if (hasAmount) {
    heroValue = `${formatNumber(row.amount)} ${t('common.currency')}`
    heroCaption = row.description || t('auditLog.detail.noDescription')
    heroTextClass = typeColorClass
  } else if (hasQuantity) {
    heroValue = signed(row.quantity)
    heroCaption = row.description || t('auditLog.detail.noDescription')
    heroTextClass = qtyColorClass(row.quantity)
  }
  const hasHero = heroValue !== null

  const arrow = dir === 'rtl' ? '←' : '→'

  return (
    <>
      {/* Header (sticky) */}
      <SheetHeader className="shrink-0 space-y-3 text-start px-5 pt-5 pb-4 pe-12 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Badge className={badgeClass}>{t(`enums.auditType.${row.type}`)}</Badge>
          <span
            className="text-xs text-gray-400 [unicode-bidi:plaintext]"
            title={formatDateTime(row.created_at, lang)}
          >
            {formatRelativeTime(row.created_at, t, lang)}
          </span>
        </div>
        <div>
          <SheetTitle className="text-lg leading-tight">
            {entityLabel
              || (row.auditable_type && t(`enums.auditEntity.${row.auditable_type}`))
              || t('auditLog.detail.fallbackTitle')}
          </SheetTitle>
          {row.auditable_type && entityLabel && (
            <SheetDescription className="mt-1">{t(`enums.auditEntity.${row.auditable_type}`)}</SheetDescription>
          )}
        </div>
      </SheetHeader>

      {/* Scrollable middle */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

        {hasHero && (
          <div className="relative bg-gray-900 border border-gray-800 rounded-xl ps-6 pe-4 py-4">
            <span className={`absolute inset-y-3.5 start-2.5 w-1 rounded-full ${typeAccentClass}`} />
            <div className={`text-3xl font-bold tracking-tight [unicode-bidi:plaintext] ${heroTextClass}`}>
              {heroValue}
            </div>
            <div className="text-sm text-gray-400 mt-1.5">{heroCaption}</div>
            {hasAmount && hasQuantity && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-500">
                <span>{t('common.quantity')}:</span>
                <span className={`font-semibold [unicode-bidi:plaintext] ${qtyColorClass(row.quantity)}`}>
                  {signed(row.quantity)}
                </span>
              </div>
            )}
          </div>
        )}

        {row.changes ? (
          <div>
            <SectionLabel label={t('auditLog.detail.sectionChanges')} barClassName={typeAccentClass}>
              <span className="text-xs text-gray-500">{t('auditLog.detail.fieldsChanged', { count: changedCount })}</span>
            </SectionLabel>
            <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
              {Object.entries(row.changes).map(([field, [oldValue, newValue]]) => (
                <div key={field} className="px-3.5 py-3">
                  <div className="text-sm font-medium text-gray-200 mb-1.5">{humanizeField(field)}</div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs text-red-400 line-through decoration-red-400/50 bg-red-500/10 rounded px-2 py-0.5 [unicode-bidi:plaintext]">
                      {String(oldValue ?? '—')}
                    </span>
                    <span className="text-gray-500 text-xs">{arrow}</span>
                    <span className="font-mono text-xs font-medium text-green-400 bg-green-500/10 rounded px-2 py-0.5 [unicode-bidi:plaintext]">
                      {String(newValue ?? '—')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : isBatch ? (
          <>
            <div>
              <SectionLabel label={t('auditLog.detail.sectionSummary')} barClassName={typeAccentClass}>
                <span className="text-xs text-gray-500 [unicode-bidi:plaintext]">
                  {t('auditLog.detail.batchId')}: {row.batch_id}
                </span>
              </SectionLabel>
              <div className="flex gap-2.5">
                <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-3">
                  <div className="text-xl font-bold text-white [unicode-bidi:plaintext]">{formatNumber(row.item_count)}</div>
                  <div className="text-[11px] text-gray-400 mt-1">{t('common.product')}</div>
                </div>
                <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-3">
                  <div className={`text-xl font-bold [unicode-bidi:plaintext] ${qtyColorClass(row.quantity)}`}>
                    {signed(row.quantity)}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">{t('common.quantity')}</div>
                </div>
                <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-3">
                  <div className="text-sm font-semibold text-white leading-tight">{row.warehouse_name || '—'}</div>
                  <div className="text-[11px] text-gray-400 mt-2">{t('common.warehouse')}</div>
                </div>
              </div>
            </div>

            <div>
              <SectionLabel label={t('auditLog.detail.sectionItems')} barClassName={typeAccentClass} />
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                {loadingBatch ? (
                  <div className="p-3.5 flex flex-col gap-2.5">
                    {[100, 88, 94].map((w, i) => (
                      <div
                        key={i}
                        style={{ width: `${w}%` }}
                        className="h-3.5 rounded bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%] animate-shimmer"
                      />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800 hover:bg-transparent">
                        <TableHead className="text-gray-400">{t('common.product')}</TableHead>
                        <TableHead className="text-gray-400">{t('common.warehouse')}</TableHead>
                        <TableHead className="text-gray-400 text-end">{t('common.quantity')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(batchItems || []).map((item, i) => (
                        <TableRow key={i} className="border-gray-800">
                          <TableCell className="font-medium text-gray-200">{item.product_name}</TableCell>
                          <TableCell className="text-gray-400">{item.warehouse_name}</TableCell>
                          <TableCell className={`text-end font-mono font-semibold [unicode-bidi:plaintext] ${qtyColorClass(item.quantity)}`}>
                            {signed(item.quantity)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </>
        ) : !hasHero ? (
          <div>
            <SectionLabel label={t('auditLog.detail.sectionDetails')} barClassName={typeAccentClass} />
            <p className="text-sm text-gray-200 leading-relaxed">
              {row.description || t('auditLog.detail.noDescription')}
            </p>
          </div>
        ) : null}

        {/* Actor */}
        <div>
          <SectionLabel label={t('auditLog.detail.sectionPerformedBy')} barClassName="bg-gray-700" />
          <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-3.5">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback>{getInitials(row.user_name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-semibold text-white">
                {row.user_name || t('auditLog.detail.systemUser')}
              </div>
              <div className="text-xs text-gray-500 mt-1 [unicode-bidi:plaintext]">
                {formatDateTime(row.created_at, lang)}
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}

export default function AuditLogDrawer({ row, onClose }) {
  const [batchItems, setBatchItems] = useState(null)
  const [loadingBatch, setLoadingBatch] = useState(false)
  const { dir } = useTranslation()

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

  return (
    <Sheet open={!!row} onOpenChange={(open) => !open && onClose()}>
      {/* Opens on the edge opposite the nav sidebar, so it follows direction. */}
      <SheetContent
        side={dir === 'rtl' ? 'left' : 'right'}
        className="w-full sm:max-w-[480px] p-0 flex flex-col overflow-hidden"
      >
        {row && (
          <DrawerBody
            row={row}
            isBatch={isBatch}
            batchItems={batchItems}
            loadingBatch={loadingBatch}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
