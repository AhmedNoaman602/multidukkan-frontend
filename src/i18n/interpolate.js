// Kept apart from translate.js, which imports the language bundles, so node --test can load it.

import { formatNumber } from '../lib/formatCore.js'

// Replace {name} placeholders. React escapes the result on render.
//
// Number values are formatted for the language (Arabic digits in Arabic). Strings pass through
// untouched: names, SKUs and invoice numbers are text, and pre-formatted values like
// formatCurrency(...) are already in the right digits. A number that must not get a thousands
// mark, like a year, is passed as toDisplayDigits(year) instead.
export const interpolate = (template, params, lang) =>
    params
        ? template.replace(/\{(\w+)\}/g, (match, name) => {
              const value = params[name]
              if (value === undefined) return match
              return typeof value === 'number' ? formatNumber(value, {}, lang) : String(value)
          })
        : template
