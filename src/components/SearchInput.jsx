import { useTranslation } from '../i18n/useTranslation'

export default function SearchInput({ value, onChange, placeholder }) {
    const { t } = useTranslation()

    return (
        <input
            type="text"
            placeholder={placeholder ?? t('common.search')}
            value={value}
            onChange={onChange}
            className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500 w-full sm:w-64 placeholder-gray-500"
        />
    )
}