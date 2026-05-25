import { useState, useEffect, useCallback } from 'react';

// ── Toast singleton ──────────────────────────────────────────────────────────
let _add = null;
export function toast(message, type = 'success') { _add?.(message, type); }

// ── Saving-bar singleton ─────────────────────────────────────────────────────
// Counter handles concurrent in-flight POSTs correctly:
// bar stays visible until ALL outstanding calls finish.
let _savingCount = 0;
let _setSaving   = null;

export function startSaving() {
  _savingCount++;
  _setSaving?.(true);
}
export function stopSaving() {
  _savingCount = Math.max(0, _savingCount - 1);
  if (_savingCount === 0) _setSaving?.(false);
}

// ── Toast appearance map ─────────────────────────────────────────────────────
const STYLE = {
  success: { bg: '#0E9B73', icon: '✓' },
  error:   { bg: '#dc2626', icon: '✕' },
  warning: { bg: '#d97706', icon: '⚠' },
  info:    { bg: '#2563eb', icon: 'ℹ' },
};

// ── Single container — mounts once in AppShell ───────────────────────────────
export default function ToastContainer() {
  const [toasts,  setToasts]  = useState([]);
  const [saving,  setSaving]  = useState(false);

  const add = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  useEffect(() => {
    _add     = add;
    _setSaving = setSaving;
    return () => { _add = null; _setSaving = null; };
  }, [add]);

  return (
    <>
      {/* ── Top saving bar — visible for every in-flight POST ── */}
      {saving && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          height: '3px', zIndex: 99998, overflow: 'hidden',
          background: 'rgba(0,0,0,0.08)',
        }}>
          <div className="leen-saving-bar" />
        </div>
      )}

      {/* ── Toast stack ── */}
      {toasts.length > 0 && (
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
      )}
    </>
  );
}
