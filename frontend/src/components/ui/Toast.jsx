/**
 * Toast.jsx — SmartMentor Toast Notification System
 * ───────────────────────────────────────────────────
 * A fully self-contained, premium toast notification system.
 *
 * Usage:
 *   1. Wrap app with <ToastProvider>
 *   2. In any component: const { showToast } = useToast();
 *   3. Call: showToast('Message here!', 'success' | 'error' | 'warning' | 'info')
 *
 * Features:
 *  - Stacked toasts (multiple simultaneous)
 *  - Slide-in from top-right with smooth fade
 *  - Auto-dismiss after 4 seconds
 *  - Manual close button
 *  - Progress bar countdown
 *  - Dark mode support
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ── Context ───────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

// ── Toast type config ─────────────────────────────────────────────────────────
const TOAST_CONFIG = {
  success: {
    icon: CheckCircle,
    containerClass: 'border-l-4 border-emerald-500 bg-white dark:bg-gray-800',
    iconClass: 'text-emerald-500',
    progressClass: 'bg-emerald-500',
    titleClass: 'text-emerald-800 dark:text-emerald-300',
  },
  error: {
    icon: XCircle,
    containerClass: 'border-l-4 border-red-500 bg-white dark:bg-gray-800',
    iconClass: 'text-red-500',
    progressClass: 'bg-red-500',
    titleClass: 'text-red-800 dark:text-red-300',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'border-l-4 border-amber-500 bg-white dark:bg-gray-800',
    iconClass: 'text-amber-500',
    progressClass: 'bg-amber-500',
    titleClass: 'text-amber-800 dark:text-amber-300',
  },
  info: {
    icon: Info,
    containerClass: 'border-l-4 border-blue-500 bg-white dark:bg-gray-800',
    iconClass: 'text-blue-500',
    progressClass: 'bg-blue-500',
    titleClass: 'text-blue-800 dark:text-blue-300',
  },
};

const AUTO_DISMISS_MS = 4000;

// ── Individual Toast Item ─────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef(null);
  const startRef = useRef(Date.now());

  // Mount animation
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Progress bar countdown
  useEffect(() => {
    const tick = 50; // ms
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        handleClose();
      }
    }, tick);

    return () => clearInterval(intervalRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = useCallback(() => {
    clearInterval(intervalRef.current);
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 350);
  }, [toast.id, onRemove]);

  const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;
  const Icon = config.icon;

  return (
    <div
      className={`
        relative overflow-hidden w-80 max-w-full rounded-xl shadow-2xl
        ${config.containerClass}
        transition-all duration-300 ease-out
        ${visible && !exiting
          ? 'translate-x-0 opacity-100 scale-100'
          : 'translate-x-full opacity-0 scale-95'
        }
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Main content */}
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className={`flex-shrink-0 mt-0.5 ${config.iconClass}`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold leading-snug ${config.titleClass}`}>
            {toast.title || capitalize(toast.type)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 leading-snug">
            {toast.message}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-0.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 dark:bg-gray-700">
        <div
          className={`h-full transition-none ${config.progressClass}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

// ── Toast Provider ────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  /**
   * Show a toast notification.
   * @param {string} message - The message to display
   * @param {'success'|'error'|'warning'|'info'} type - Toast type
   * @param {string} [title] - Optional override title (defaults to type name)
   */
  const showToast = useCallback((message, type = 'info', title = null) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, type, title }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container — fixed top-right */}
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

export default ToastProvider;
