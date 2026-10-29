import { roundPrice } from './money.js'

// Mirrors OrderService@addItem: the customer's tier price (or the normal price when that tier is
// empty) × the unit's factor. Only a preview — the server resolves the price itself when none is sent.
const factorFor = (unitType, conversionFactor) =>
    unitType === 'secondary' && Number(conversionFactor) > 0 ? Number(conversionFactor) : 1

export function defaultSalePrice(product, priceTier, unitType) {
    const tierPrice = priceTier && priceTier !== 'default' ? product[`price_${priceTier}`] : null
    const piecePrice = Number(tierPrice ?? product.price ?? 0)
    return roundPrice(piecePrice * factorFor(unitType, product.conversion_factor))
}
