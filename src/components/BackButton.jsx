import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from '../i18n/useTranslation'

export default function BackButton({ to, label }) {
    const navigate = useNavigate()
    const { t, dir } = useTranslation()
    const Icon = dir === 'rtl' ? ChevronRight : ChevronLeft

    return (
        <button
            onClick={() => to ? navigate(to) : navigate(-1)}
            className="group flex items-center gap-2 px-4 py-2.5 bg-gray-900 border border-gray-700 text-gray-300 hover:text-white rounded-xl text-sm font-medium hover:bg-gray-800 hover:border-gray-600 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all duration-200"
        >
            <span className={`flex transition-transform ${dir === 'rtl' ? 'group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`}>
                <Icon size={16} />
            </span>
            {label || t('common.back')}
        </button>
    )
}