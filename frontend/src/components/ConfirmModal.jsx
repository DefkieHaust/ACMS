import Modal from './Modal';

export default function ConfirmModal({ open, onClose, onConfirm, title, message, confirmText, cancelText, danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3">
        <button onClick={onConfirm} className={`flex-1 py-2 px-4 rounded-lg font-medium text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
          {confirmText || 'Confirm'}
        </button>
        <button onClick={onClose} className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
          {cancelText || 'Cancel'}
        </button>
      </div>
    </Modal>
  );
}
