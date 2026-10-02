// Stock locations: every store has exactly one shelf (type 'shelf'); every other
// warehouse is storage. The backend owns these rules — these helpers only order
// and pick from the list it returns.

export const isShelf = (warehouse) => warehouse?.type === 'shelf'

export const sortShelfFirst = (warehouses) =>
    [...warehouses].sort((a, b) => Number(isShelf(b)) - Number(isShelf(a)))

export const shelfIdFor = (warehouses, storeId) =>
    warehouses.find(w => isShelf(w) && w.store_id === parseInt(storeId))?.id ?? ''

// Product stock rows as the API expects them: the entered quantity and its unit (plus loose
// base units on a secondary row), never a converted amount — the server converts.
export const stockPayload = (rows, hasSecondary) => rows
    .filter(r => r.warehouse_id)
    .map(r => {
        const secondary = hasSecondary && r.unit_type === 'secondary'
        return {
            warehouse_id: parseInt(r.warehouse_id),
            quantity: parseInt(r.quantity) || 0,
            unit_type: secondary ? 'secondary' : 'base',
            ...(secondary && parseInt(r.loose_quantity) > 0 && { loose_quantity: parseInt(r.loose_quantity) }),
            threshold: parseInt(r.threshold) || 10,
        }
    })
