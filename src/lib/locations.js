// Stock locations: every store has exactly one shelf (type 'shelf'); every other
// warehouse is storage. The backend owns these rules — these helpers only order
// and pick from the list it returns.

export const isShelf = (warehouse) => warehouse?.type === 'shelf'

export const sortShelfFirst = (warehouses) =>
    [...warehouses].sort((a, b) => Number(isShelf(b)) - Number(isShelf(a)))

export const shelfIdFor = (warehouses, storeId) =>
    warehouses.find(w => isShelf(w) && w.store_id === parseInt(storeId))?.id ?? ''
