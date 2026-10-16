// A purchase line's unit_price is per the line's own unit (piece or box); the server divides it by
// the box size to get the cost per piece. A suggested price keeps the per-piece cost it came from, so
// a unit switch recalculates it from that cost. A price the user typed never changes on its own — a
// unit switch only flags it for review, because we can't know which unit it was meant for.

// Same scale as the backend rule for purchase prices (StorePurchaseOrderRequest: decimal:0,2).
export const UNIT_PRICE_DECIMALS = 2

// Mirrors Product::factorFor() on the backend.
const factorFor = (unitType, conversionFactor) =>
    unitType === 'secondary' && Number(conversionFactor) > 0 ? Number(conversionFactor) : 1

export function suggestedPrice(pieceCost, unitType, conversionFactor) {
    const scale = 10 ** UNIT_PRICE_DECIMALS
    return Math.round(Number(pieceCost || 0) * factorFor(unitType, conversionFactor) * scale) / scale
}

export function newLine(product, pieceCost) {
    return {
        product_id: String(product.id),
        quantity: 1,
        warehouse_id: '',
        unit_type: 'base',
        unit_price: suggestedPrice(pieceCost, 'base', product.conversion_factor),
        price_source: 'suggested',
        piece_cost: Number(pieceCost || 0),
    }
}

// Lines saved before price_source existed count as typed: their price is never changed silently.
// A flagged line remembers the unit its price was typed for (price_unit), so Convert knows the source.
export function changeLineUnit(line, unitType, conversionFactor) {
    if (unitType === line.unit_type) return line
    if (unitType === 'secondary' && !(Number(conversionFactor) > 0)) return line

    if (line.price_source === 'suggested' && line.piece_cost != null) {
        return { ...line, unit_type: unitType, unit_price: suggestedPrice(line.piece_cost, unitType, conversionFactor) }
    }

    const priceUnit = line.price_review ? line.price_unit : line.unit_type
    if (unitType === priceUnit) return { ...line, unit_type: unitType, price_review: false }

    return { ...line, unit_type: unitType, price_review: true, price_unit: priceUnit }
}

export function changeLinePrice(line, value) {
    return { ...line, unit_price: value, price_source: 'typed', price_review: false }
}

export function confirmLinePrice(line) {
    return { ...line, price_review: false }
}

// The flagged price re-expressed in the line's current unit, or null when the source unit is unknown.
export function convertedPrice(line, conversionFactor) {
    if (!line.price_unit) return null
    const pieceCost = Number(line.unit_price || 0) / factorFor(line.price_unit, conversionFactor)
    return suggestedPrice(pieceCost, line.unit_type, conversionFactor)
}

export function convertLinePrice(line, conversionFactor) {
    const price = convertedPrice(line, conversionFactor)
    return price === null ? line : { ...line, unit_price: price, price_review: false }
}

export const needsPriceReview = (line) => line.price_review === true
