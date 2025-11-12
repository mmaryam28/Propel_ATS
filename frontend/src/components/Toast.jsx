// frontend/src/components/Toast.jsx
import React from 'react';

export function Toast({ message, show, onUndo, onClose }) {
  React.useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Auto-close after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="bg-gray-900 text-white rounded-lg shadow-lg p-4 flex items-center gap-4 min-w-[320px]">
        <div className="flex-1 text-sm">
          {message}
        </div>
        <div className="flex gap-2">
          {onUndo && (
            <button
              onClick={onUndo}
              className="px-3 py-1 text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-white/10 rounded"
            >
              Undo
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-gray-400 hover:text-white"
          >
            ✕
            </button>
        </div>
      </div>
    </div>
  );
}
