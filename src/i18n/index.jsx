import { useEffect, useMemo, useState } from 'react'
import { LanguageContext } from './useTranslation'
import { STORAGE_KEY, LANGUAGES, readStoredLang, titles, translate } from './translate'

// Owns the active language and keeps <html lang/dir> and the document title in
// sync with it. Mounted once in main.jsx, above everything else, so changing
// language re-renders the tree without remounting or reloading.
export function LanguageProvider({ children }) {
    const [lang, setLangState] = useState(readStoredLang)

    const dir = lang === 'ar' ? 'rtl' : 'ltr'

    useEffect(() => {
        document.documentElement.lang = lang
        document.documentElement.dir = dir
        document.title = titles[lang]
    }, [lang, dir])

    const value = useMemo(() => {
        const setLang = (next) => {
            if (!LANGUAGES.includes(next)) return
            localStorage.setItem(STORAGE_KEY, next)
            setLangState(next)
        }

        return {
            lang,
            dir,
            setLang,
            t: (key, params) => translate(lang, key, params),
        }
    }, [lang, dir])

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
