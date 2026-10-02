import { useQuery, keepPreviousData } from '@tanstack/react-query'
import api from '../api/axios'

// Shelf vs storage stock for the products on an order, keyed by product id. Display only:
// the server re-checks stock under lock when the order is saved.
export function useStoreAvailability(storeId, productIds) {
    const ids = [...new Set(productIds.map(id => parseInt(id)).filter(Boolean))].sort((a, b) => a - b)

    const { data } = useQuery({
        queryKey: ['availability', storeId ? parseInt(storeId) : null, ids],
        queryFn: () => api.get('/inventory/availability', {
            params: { store_id: storeId || undefined, product_ids: ids },
        }).then(res => res.data.data),
        enabled: !!storeId && ids.length > 0,
        placeholderData: keepPreviousData,
    })

    return Object.fromEntries((data || []).map(row => [row.product_id, row]))
}

// Base units a set of order lines needs per product (1 box + 5 pcs = 17).
export function baseNeedsByProduct(lines, products) {
    return lines.reduce((needs, line) => {
        const product = products.find(p => p.id === parseInt(line.product_id))
        if (!product) return needs
        const factor = line.unit_type === 'secondary' && Number(product.conversion_factor) > 0
            ? Number(product.conversion_factor)
            : 1
        needs[product.id] = (needs[product.id] || 0) + (parseInt(line.quantity) || 0) * factor
        return needs
    }, {})
}
