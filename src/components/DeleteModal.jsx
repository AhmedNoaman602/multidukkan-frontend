import Modal from './Modal'

export default function DeleteModal({
    open,
    onClose,
    onConfirm,
    deleting = false,
    title = 'حذف العنصر',
    name,
    warning,
}) {
    return (
        <Modal open={open} onClose={onClose} title={title}>
            <form onSubmit={(e) => { e.preventDefault(); onConfirm() }}>
                <div className="space-y-4">
                    <p className="text-gray-300 text-sm">
                        متأكد إنك عايز تحذف{' '}
                        <span className="text-white font-semibold">{name}</span>؟
                        الخطوة دي مش هتقدر ترجع فيها.
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
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={deleting}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {deleting ? 'جاري الحذف...' : 'أيوة، احذف'}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    )
}