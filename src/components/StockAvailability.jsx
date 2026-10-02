import { useTranslation } from '../i18n/useTranslation'
import { formatNumber, formatUnitBreakdown } from '../lib/format'

// "Shelf 8 · Store 68 (5 box + 8 pcs)", with a soft warning when the order needs more than the
// store holds. Never blocks: the server decides when the order is saved.
export default function StockAvailability({ availability, product, needed = 0, className = '' }) {
    const { t } = useTranslation()
    if (!availability || !product) return null

    const short = needed > availability.total_quantity

    return (
        <p className={`text-[10px] leading-tight ${short ? 'text-orange-400' : 'text-gray-500'} ${className}`}>
            {t('orders.availability.summary', {
                shelf: formatNumber(availability.shelf_quantity),
                store: formatUnitBreakdown(availability.total_quantity, product),
            })}
            {short && <> · {t('orders.availability.notEnough', { qty: formatNumber(availability.total_quantity) })}</>}
        </p>
    )
}
