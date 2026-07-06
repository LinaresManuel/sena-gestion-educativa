export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  saving,
  danger,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  saving?: boolean;
  danger?: boolean;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button>
          <button onClick={onConfirm} disabled={saving}
            className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 ${
              danger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
            }`}>
            {saving ? 'Procesando...' : (confirmText || 'Confirmar')}
          </button>
        </div>
      </div>
    </div>
  );
}
