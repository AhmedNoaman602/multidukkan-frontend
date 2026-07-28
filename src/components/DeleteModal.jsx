import Modal from './Modal'
import { useTranslation } from '../i18n/useTranslation'

export default function DeleteModal({
    open,
    onClose,
    onConfirm,
    deleting = false,
    title,
    name,
    warning,
}) {
    const { t } = useTranslation()

    return (
        <Modal open={open} onClose={onClose} title={title || t('common.deleteItem')}>
            <form onSubmit={(e) => { e.preventDefault(); onConfirm() }}>
                <div className="space-y-4">
                    <p className="text-gray-300 text-sm">
                        {t('common.confirmDelete', { name })}
                    </p>

                    {warning && (
                        <div className="bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3">
                            <p className="text-red-400 text-xs">{warning}</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={deleting}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {deleting ? t('common.deleting') : t('common.yesDelete')}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    )
}