export default function Modal({ open, onClose, title, children, error, success }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        {children}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mt-6 text-sm">
            {error}
          </div>
        )}
        {success && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg mt-6 text-sm">
                    {success}
                </div>
            )}
      </div>
    </div>
  );
}