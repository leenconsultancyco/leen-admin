import { useState, useEffect, useCallback } from 'react';

// Module-level singleton — lets any component call toast() without prop drilling.
let _add = null;

export function toast(message, type = 'success') {
  _add?.(message, type);
}

const STYLE = {
  success: { bg: '#0E9B73', icon: '✓' },
  error:   { bg: '#dc2626', icon: '✕' },
  warning: { bg: '#d97706', icon: '⚠' },
  info:    { bg: '#2563eb', icon: 'ℹ' },
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  useEffect(() => {
    _add = add;
    return () => { _add = null; };
  }, [add]);

  if (!toasts.length) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '80px', right: '20px',
      display: 'flex', flexDirection: 'column', gap: '8px',
      zIndex: 99999, pointerEvents: 'none',
    }}>
      {toasts.map(({ id, message, type }) => {
        const s = STYLE[type] || STYLE.success;
        return (
          <div key={id} className="leen-toast" style={{
            background: s.bg, color: '#fff',
            padding: '10px 16px', borderRadius: '10px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '14px', fontWeight: '500',
            minWidth: '200px', maxWidth: '300px',
          }}>
            <span style={{ fontSize: '15px', fontWeight: '700', lineHeight: 1 }}>{s.icon}</span>
            {message}
          </div>
        );
      })}
    </div>
  );
}
