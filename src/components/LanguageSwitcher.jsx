import { useTranslation } from '../i18n/useTranslation'

// Each option is always written in its own language, so the control stays
// readable whichever language is active. This is the one place we deliberately
// don't run the visible label through t().
const options = [
    { lang: 'en', label: 'EN', ariaKey: 'navigation.switchToEnglish' },
    { lang: 'ar', label: 'العربية', ariaKey: 'navigation.switchToArabic' },
]

export default function LanguageSwitcher() {
    const { lang, setLang, t } = useTranslation()

    return (
        <div className="flex gap-1 p-0.5 bg-gray-800 rounded-md mb-2">
            {options.map(option => (
                <button
                    key={option.lang}
                    type="button"
                    onClick={() => setLang(option.lang)}
                    aria-label={t(option.ariaKey)}
                    aria-pressed={lang === option.lang}
                    className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                        lang === option.lang
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}
