import { useEffect, useRef, useState } from 'react';

export default function Modal({ open, onClose, title, children }) {
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        const el = contentRef.current;
        if (el) {
          const focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          if (focusable.length > 0) focusable[0].focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = '';
      const timer = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!mounted && !open) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${open ? 'animate-fade-in' : 'opacity-0'}`}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto p-8 border border-gray-100 dark:border-gray-800 ${open ? 'animate-scale-in' : ''}`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="modal-title" className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Close modal">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
