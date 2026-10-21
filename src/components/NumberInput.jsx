import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../i18n/useTranslation'
import { normalizeNumberText, toDisplayNumberText } from '../lib/number'

const ALIGNMENT = /\btext-(left|right|center|start|end)\b/

// Drop-in replacement for <input type="number">, which silently drops Arabic digits and turns
// "12٫5" into 125. Readable input is normalized ("١٢٫٥" → "12.5") and passed up; anything else
// stays on screen exactly as typed, marked invalid, and is never passed up — so a form can't
// submit it and screens without a form check reportInvalidNumberInput() before saving.
// `decimals` is the field's own limit: 2 for money, 0 for counts.
//
// On Arabic screens the box shows Arabic digits ("١٢٫٥") while the parent still receives the
// plain value ("12.5"), the same display-only rule as the rest of the app.
export default function NumberInput({ value, onChange, decimals = 2, min, max, className = '', ...rest }) {
    const { t, dir, lang } = useTranslation()
    const ref = useRef(null)
    // The unreadable text being shown, tied to the value it was typed over; a new value from
    // the parent (a reset, a removed row) replaces it.
    const [draft, setDraft] = useState(null)
    const isDraft = Boolean(draft) && Object.is(draft.base, value)
    const shown = isDraft ? draft.raw : toDisplayNumberText(String(value ?? ''), lang)

    const messageFor = (raw) => {
        const { text, error } = normalizeNumberText(raw, { decimals, typing: true })
        if (error) return t(`common.numberInput.${error}`, { count: decimals })
        if (text === '') return ''
        const number = Number(text)
        if (min != null && min !== '' && number < Number(min)) return t('common.numberInput.min', { min: Number(min) })
        if (max != null && max !== '' && number > Number(max)) return t('common.numberInput.max', { max: Number(max) })
        return ''
    }

    useEffect(() => {
        ref.current?.setCustomValidity(messageFor(shown))
    })

    const handleChange = (e) => {
        const input = e.target
        const { text, error } = normalizeNumberText(input.value, { decimals, typing: true })

        if (error) {
            setDraft({ raw: input.value, base: value })
            input.setCustomValidity(messageFor(input.value))
            // A lone "." is half-typed, not wrong: it still blocks saving, but no popup.
            if (error !== 'incomplete') input.reportValidity()
            return
        }

        setDraft(null)
        const display = toDisplayNumberText(text, lang)
        if (display !== input.value) {
            const caret = Math.max(0, Math.min(display.length, input.selectionStart + display.length - input.value.length))
            input.value = display
            input.setSelectionRange(caret, caret)
        }
        input.setCustomValidity(messageFor(text))
        // The box now holds the display text, so the parent gets the plain value in an event of
        // its own. Every caller reads only e.target.value; this one never changes afterwards.
        onChange?.({ target: { value: text, name: input.name } })
    }

    // dir="ltr" keeps "12." from showing as ".12" on Arabic screens. It also flips what
    // text-start/end mean, so those become the physical side the page direction intended.
    const classes = dir === 'rtl'
        ? className.replace(/\btext-end\b/g, 'text-left').replace(/\btext-start\b/g, 'text-right')
        : className
    const align = dir === 'rtl' && !ALIGNMENT.test(classes) ? ' text-right' : ''
    const message = isDraft ? messageFor(draft.raw) : ''

    return (
        <input
            {...rest}
            ref={ref}
            data-number-input=""
            type="text"
            inputMode={decimals > 0 ? 'decimal' : 'numeric'}
            dir="ltr"
            autoComplete="off"
            value={shown}
            onChange={handleChange}
            aria-invalid={isDraft || undefined}
            title={message || rest.title}
            className={`${classes}${align}${isDraft ? ' !border-red-500' : ''}`}
        />
    )
}
