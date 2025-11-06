import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmVariant?: 'primary' | 'danger';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmVariant = 'primary',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      <div className="relative bg-white opacity-100 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border-2 border-outline/20 z-10" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-on-surface mb-2">{title}</h3>
        <p className="text-on-surface-variant mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-surface-variant text-on-surface-variant font-medium hover:bg-surface-variant/80 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              confirmVariant === 'danger'
                ? 'bg-error text-on-error hover:bg-error/90'
                : 'bg-primary text-on-primary hover:bg-primary/90'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

