import { createContext, useContext } from 'react'

export const LanguageContext = createContext(null)

// The one hook every component uses:
//   const { t, lang, dir, setLang } = useTranslation()
export function useTranslation() {
    return useContext(LanguageContext)
}
