import Modal from './Modal';
import Button from './Button';

export default function ConfirmModal({ open, onClose, onConfirm, title, message, confirmText, cancelText, danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3">
        <Button onClick={onConfirm} variant={danger ? 'danger' : 'primary'} className="flex-1">
          {confirmText || 'Confirm'}
        </Button>
        <Button onClick={onClose} variant="secondary" className="flex-1">
          {cancelText || 'Cancel'}
        </Button>
      </div>
    </Modal>
  );
}
