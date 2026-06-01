import Modal from './Modal'

export default function DeleteModal({
    open,
    onClose,
    onConfirm,
    deleting = false,
    title = 'Delete Item',
    name,
    warning,
}) {
    return (
        <Modal open={open} onClose={onClose} title={title}>
            <form onSubmit={(e) => { e.preventDefault(); onConfirm() }}>
                <div className="space-y-4">
                    <p className="text-gray-300 text-sm">
                        Are you sure you want to delete{' '}
                        <span className="text-white font-semibold">{name}</span>?
                        This action cannot be undone.
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
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={deleting}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {deleting ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    )
}