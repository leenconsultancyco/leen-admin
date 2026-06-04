import { useState, useEffect, useMemo } from 'react';
import { Spinner } from '@heroui/react';
import { updatePassword, updateSettings, getExpenseCategories, saveExpenseCategories, backup } from '../api';
import { hashPassword, getAdminUsername } from '../auth';
import { useI18n } from '../i18n';
import LanguageToggle from '../components/LanguageToggle';
import ThemeSelector from '../components/ThemeSelector';
import ConfirmModal from '../components/ConfirmModal';
import { downloadJSON } from '../utils';

const BACKUP_KEY    = 'leen_last_backup';
const URL_KEY       = 'leen_script_url';
const CENTER_KEY    = 'leen_center_info';

// ── Shared input / label styles ──────────────────────────────────────────────
const INP = {
  display: 'block', width: '100%',
  border: '1px solid #DCE1EA', borderRadius: 10,
  padding: '10px 14px', fontSize: 14,
  backgroundColor: '#fff', color: '#0B1320',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color .15s',
};
const LBL = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: '#0E9B73', textTransform: 'uppercase',
  letterSpacing: '.04em', marginBottom: 6,
};
const btnPrimary = {
  background: '#0E9B73', color: '#fff', border: 'none', borderRadius: 10,
  fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
};
const btnGhost = {
  background: 'transparent', color: '#2A3344', border: '1px solid #DCE1EA', borderRadius: 10,
  fontWeight: 500, cursor: 'pointer',
};

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <label style={LBL}>{label}</label>
      {children}
    </div>
  );
}
function FocusInput({ type = 'text', ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      {...props}
      style={{ ...INP, borderColor: focused ? '#0E9B73' : '#DCE1EA' }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}
function SaveBtn({ loading, disabled, onClick, label }) {
  return (
    <button
      type="button"
      disabled={loading || disabled}
      onClick={onClick}
      style={{
        background: loading || disabled ? '#a7d4c5' : '#0E9B73',
        color: '#fff', border: 'none', borderRadius: 10,
        padding: '10px 22px', fontSize: 14, fontWeight: 600,
        cursor: loading || disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}
    >
      {loading && <Spinner size="sm" />}
      {label}
    </button>
  );
}
function StatusMsg({ msg }) {
  if (!msg) return null;
  return (
    <p style={{ fontSize: 13, color: msg.ok ? '#16a34a' : '#dc2626', margin: '4px 0 0' }}>
      {msg.ok ? '✓ ' : '✗ '}{msg.text}
    </p>
  );
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  return d;
}
function fmtBackupDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Nav icons ─────────────────────────────────────────────────────────────────
function IconShield()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function IconHome()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function IconTheme()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>; }
function IconBackup()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function IconDownload()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function IconCategories(){ return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>; }

const NAV_ITEMS = [
  { id: 'security',    Icon: IconShield     },
  { id: 'centerInfo',  Icon: IconHome       },
  { id: 'theme',       Icon: IconTheme      },
  { id: 'categories',  Icon: IconCategories },
  { id: 'backup',      Icon: IconBackup     },
];

// ── Panels ────────────────────────────────────────────────────────────────────
function SecurityPanel({ t, lang }) {
  const [pw, setPw]           = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg]     = useState(null);

  const [scriptUrl, setScriptUrl]   = useState(localStorage.getItem(URL_KEY) || '');
  const [editingUrl, setEditingUrl] = useState(!localStorage.getItem(URL_KEY));
  const [urlSaving, setUrlSaving]   = useState(false);

  async function handlePasswordSave() {
    if (!pw.current) { setPwMsg({ text: t('settings.currentPassword') + ' required', ok: false }); return; }
    if (pw.next !== pw.confirm) { setPwMsg({ text: t('settings.passwordMismatch'), ok: false }); return; }
    if (!pw.next) return;
    setPwSaving(true);
    const newHash = await hashPassword(pw.next);
    const result  = await updatePassword(newHash);
    setPwSaving(false);
    if (result.success) {
      setPwMsg({ text: t('settings.passwordChanged'), ok: true });
      setPw({ current: '', next: '', confirm: '' });
    } else {
      setPwMsg({ text: result.error || 'Error', ok: false });
    }
  }

  function saveUrl() {
    if (!scriptUrl.trim()) return;
    setUrlSaving(true);
    localStorage.setItem(URL_KEY, scriptUrl.trim());
    setTimeout(() => { setUrlSaving(false); setEditingUrl(false); window.location.reload(); }, 400);
  }

  const pwReady = pw.current && pw.next && pw.next === pw.confirm;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Change password */}
      <div>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#0B1320', margin: '0 0 20px' }}>
          {t('settings.changePassword')}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label={t('settings.currentPassword')}>
            <FocusInput type="password" value={pw.current}
              onChange={(e) => setPw(p => ({ ...p, current: e.target.value }))} />
          </Field>
          <Field label={t('settings.newPassword')}>
            <FocusInput type="password" value={pw.next}
              onChange={(e) => setPw(p => ({ ...p, next: e.target.value }))} />
          </Field>
          <Field label={t('settings.confirmPassword')}>
            <FocusInput type="password" value={pw.confirm}
              onChange={(e) => setPw(p => ({ ...p, confirm: e.target.value }))} />
            {pw.confirm && pw.next !== pw.confirm && (
              <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{t('settings.passwordMismatch')}</p>
            )}
          </Field>
          <StatusMsg msg={pwMsg} />
          <div><SaveBtn loading={pwSaving} disabled={!pwReady} onClick={handlePasswordSave} label={t('therapistMgmt.saveChanges') || 'Save changes'} /></div>
        </div>
      </div>

      {/* Backend URL */}
      <div style={{ borderTop: '1px solid #E6EAF1', paddingTop: 22 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#5A6478', margin: '0 0 12px' }}>
          {t('settings.backendUrl')}
        </p>
        {editingUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <FocusInput type="url" value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/..." />
            <div>
              <SaveBtn loading={urlSaving} disabled={!scriptUrl.trim()}
                onClick={saveUrl} label={lang === 'ar' ? 'حفظ والاتصال' : 'Save & Reconnect'} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#16a34a' }}>✓ {lang === 'ar' ? 'تم الاتصال' : 'Backend connected'}</span>
            <button type="button" onClick={() => setEditingUrl(true)}
              style={{ fontSize: 12, color: '#0E9B73', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              {t('general.edit')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CenterInfoPanel({ t }) {
  const saved = JSON.parse(localStorage.getItem(CENTER_KEY) || '{}');
  const [form, setForm]     = useState({ name: saved.name || '', phone: saved.phone || '', email: saved.email || '', address: saved.address || '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState(null);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    setSaving(true);
    const result = await updateSettings({
      CENTER_NAME:  form.name,
      CENTER_PHONE: form.phone,
      CENTER_EMAIL: form.email,
      CENTER_ADDRESS: form.address,
    });
    setSaving(false);
    if (result.success) {
      localStorage.setItem(CENTER_KEY, JSON.stringify(form));
      setMsg({ text: 'Saved successfully', ok: true });
    } else {
      setMsg({ text: result.error || 'Error saving', ok: false });
    }
  }

  return (
    <div>
      <p style={{ fontSize: 18, fontWeight: 700, color: '#0B1320', margin: '0 0 20px' }}>
        {t('settings.centerInfo') === 'Center Info' ? 'Center information' : t('settings.centerInfo')}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px', marginBottom: 20 }}>
        <Field label="Center name">
          <FocusInput value={form.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Phone">
          <FocusInput value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="Email">
          <FocusInput type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label="Address">
          <FocusInput value={form.address} onChange={(e) => set('address', e.target.value)} />
        </Field>
      </div>
      <StatusMsg msg={msg} />
      <div style={{ marginTop: 8 }}>
        <SaveBtn loading={saving} disabled={false} onClick={handleSave} label="Save changes" />
      </div>
    </div>
  );
}

function ThemePanel({ t }) {
  return (
    <div>
      <p style={{ fontSize: 18, fontWeight: 700, color: '#0B1320', margin: '0 0 20px' }}>
        {t('settings.chooseTheme')}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <p style={{ ...LBL, marginBottom: 12 }}>Theme</p>
          <ThemeSelector />
        </div>
        <div>
          <p style={{ ...LBL, marginBottom: 12 }}>Language</p>
          <LanguageToggle />
        </div>
      </div>
    </div>
  );
}

const DEFAULT_CATS = ['Cleaning','Coffee & Break','Facilities','Marketing','Salary','Initial Cost','Other'];

function CategoriesPanel({ t, lang }) {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [newCat, setNewCat]     = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [newSubs, setNewSubs]   = useState({});   // { [category]: string }
  const [addingSub, setAddingSub] = useState({}); // { [category]: bool }
  const [deleteSubTarget, setDeleteSubTarget] = useState(null); // { cat, sub }

  useEffect(() => {
    setLoading(true);
    getExpenseCategories().then((r) => {
      if (r.success && Array.isArray(r.data) && r.data.length > 0) {
        setRows(r.data);
      } else {
        // seed with defaults on first use
        const defaults = DEFAULT_CATS.map((c) => ({ Category: c, Subcategory: '' }));
        setRows(defaults);
      }
      setLoading(false);
    });
  }, []);

  // Grouped: { [cat]: string[] }
  const grouped = useMemo(() => {
    const map = {};
    rows.forEach(({ Category, Subcategory }) => {
      if (!Category) return;
      if (!map[Category]) map[Category] = [];
      if (Subcategory) map[Category].push(Subcategory);
    });
    return map;
  }, [rows]);

  function toRows(g) {
    return Object.entries(g).flatMap(([cat, subs]) =>
      subs.length > 0
        ? subs.map((sub) => ({ Category: cat, Subcategory: sub }))
        : [{ Category: cat, Subcategory: '' }]
    );
  }

  async function persist(newGrouped) {
    setSaving(true);
    const flat = toRows(newGrouped);
    setRows(flat);
    await saveExpenseCategories(flat);
    setSaving(false);
  }

  function addCategory() {
    const name = newCat.trim();
    if (!name || grouped[name]) return;
    const g = { ...grouped, [name]: [] };
    setNewCat('');
    setAddingCat(false);
    persist(g);
  }

  function deleteCategory(cat) {
    if (!window.confirm(t('settings.deleteCategoryConfirm'))) return;
    const g = { ...grouped };
    delete g[cat];
    persist(g);
  }

  function addSub(cat) {
    const sub = (newSubs[cat] || '').trim();
    if (!sub || (grouped[cat] || []).includes(sub)) return;
    const g = { ...grouped, [cat]: [...(grouped[cat] || []), sub] };
    setNewSubs((s) => ({ ...s, [cat]: '' }));
    setAddingSub((s) => ({ ...s, [cat]: false }));
    persist(g);
  }

  function deleteSub(cat, sub) {
    setDeleteSubTarget({ cat, sub });
  }

  function confirmDeleteSub() {
    if (!deleteSubTarget) return;
    const { cat, sub } = deleteSubTarget;
    const g = { ...grouped, [cat]: grouped[cat].filter((s) => s !== sub) };
    setDeleteSubTarget(null);
    persist(g);
  }

  const cats = Object.keys(grouped);

  return (
    <div>
      <p style={{ fontSize: 18, fontWeight: 700, color: '#0B1320', margin: '0 0 6px' }}>
        {t('settings.categories')}
      </p>
      <p style={{ fontSize: 13, color: '#5A6478', margin: '0 0 20px' }}>
        {t('settings.categoriesDesc')}
      </p>

      {/* Add category row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        {addingCat ? (
          <>
            <input
              autoFocus
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addCategory(); if (e.key === 'Escape') setAddingCat(false); }}
              placeholder={t('settings.categoryPlaceholder')}
              style={{ ...INP, flex: 1, maxWidth: 220 }}
            />
            <button type="button" onClick={addCategory}
              style={{ ...btnPrimary, padding: '8px 14px', fontSize: 13 }}>
              {t('general.save')}
            </button>
            <button type="button" onClick={() => { setAddingCat(false); setNewCat(''); }}
              style={{ ...btnGhost, padding: '8px 10px', fontSize: 13 }}>
              {t('general.cancel')}
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setAddingCat(true)}
            style={{ ...btnPrimary, padding: '8px 16px', fontSize: 13 }}>
            + {t('settings.addCategory')}
          </button>
        )}
        {saving && <Spinner size="sm" />}
      </div>

      <ConfirmModal
        isOpen={!!deleteSubTarget}
        onClose={() => setDeleteSubTarget(null)}
        onConfirm={confirmDeleteSub}
        title={lang === 'ar' ? 'حذف التصنيف الفرعي' : 'Delete sub-category'}
        message={deleteSubTarget
          ? (lang === 'ar'
              ? `هل أنت متأكد من حذف "${deleteSubTarget.sub}"؟ لا يمكن التراجع عن هذا الإجراء.`
              : `Are you sure you want to delete "${deleteSubTarget.sub}"? This cannot be undone.`)
          : ''}
        confirmColor="danger"
      />

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8089A0', fontSize: 13 }}>
          <Spinner size="sm" /> Loading…
        </div>
      ) : cats.length === 0 ? (
        <p style={{ fontSize: 13, color: '#8089A0' }}>{t('settings.noCategories')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cats.map((cat) => (
            <div key={cat} style={{
              border: '1px solid #E6EAF1', borderRadius: 12, padding: '12px 14px',
            }}>
              {/* Category header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: grouped[cat].length > 0 || addingSub[cat] ? 10 : 0 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0B1320' }}>{cat}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {!addingSub[cat] && (
                    <button type="button"
                      onClick={() => setAddingSub((s) => ({ ...s, [cat]: true }))}
                      style={{ fontSize: 12, color: '#0E9B73', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '2px 4px' }}>
                      + {t('settings.addSubCategory')}
                    </button>
                  )}
                  <button type="button" onClick={() => deleteCategory(cat)}
                    style={{ fontSize: 13, color: '#DC3A4D', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', lineHeight: 1 }}
                    title="Delete category">
                    ×
                  </button>
                </div>
              </div>

              {/* Sub-categories */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {grouped[cat].map((sub) => (
                  <span key={sub} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: '#F7F8FB', border: '1px solid #DCE1EA',
                    borderRadius: 8, padding: '3px 10px', fontSize: 12, color: '#2A3344',
                  }}>
                    {sub}
                    <button type="button" onClick={() => deleteSub(cat, sub)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8089A0', fontSize: 14, lineHeight: 1, padding: 0 }}>
                      ×
                    </button>
                  </span>
                ))}

                {/* Inline add sub-category input */}
                {addingSub[cat] && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <input
                      autoFocus
                      value={newSubs[cat] || ''}
                      onChange={(e) => setNewSubs((s) => ({ ...s, [cat]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') addSub(cat); if (e.key === 'Escape') setAddingSub((s) => ({ ...s, [cat]: false })); }}
                      placeholder={t('settings.subCategoryPlaceholder')}
                      style={{ ...INP, width: 150, padding: '3px 8px', fontSize: 12, borderRadius: 8 }}
                    />
                    <button type="button" onClick={() => addSub(cat)}
                      style={{ fontSize: 12, color: '#0E9B73', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                      ✓
                    </button>
                    <button type="button" onClick={() => setAddingSub((s) => ({ ...s, [cat]: false }))}
                      style={{ fontSize: 14, color: '#8089A0', background: 'none', border: 'none', cursor: 'pointer' }}>
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BackupPanel({ t, lang, lastBackup, onBackupDone }) {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice]   = useState(null);

  const days     = daysSince(lastBackup);
  const dateStr  = fmtBackupDate(lastBackup);

  async function handleBackup() {
    setLoading(true);
    const result = await backup();
    setLoading(false);
    if (!result.success) { setNotice({ text: result.error || 'Error', ok: false }); return; }
    const today    = new Date().toISOString().slice(0, 10);
    const filename = `leen-backup-${today}.json`;
    downloadJSON({
      exportedAt:   new Date().toISOString(),
      center:       'Leen Psychotherapy Center',
      transactions: result.data?.transactions ?? [],
      expenses:     result.data?.expenses     ?? [],
      bookings:     result.data?.bookings     ?? [],
      payouts:      result.data?.payouts      ?? [],
    }, filename);
    await updateSettings({ LAST_BACKUP_DATE: today });
    setNotice({ text: `${t('settings.backupDownloaded')}: ${filename}`, ok: true });
    onBackupDone?.(today);
    setTimeout(() => setNotice(null), 6000);
  }

  return (
    <div>
      <p style={{ fontSize: 18, fontWeight: 700, color: '#0B1320', margin: '0 0 6px' }}>
        {t('settings.backup')}
      </p>
      <p style={{ fontSize: 13, color: '#0E9B73', margin: '0 0 24px' }}>
        {lang === 'ar'
          ? 'تشمل النسخة: المعاملات، المصروفات، الحجوزات، المستحقات.'
          : 'Backup downloads a JSON snapshot of all sheets to your device.'}
      </p>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        border: '1px solid #E6EAF1', borderRadius: 14, padding: '14px 18px',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: '#FFF3E6', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#0B1320', margin: 0 }}>
              {lastBackup
                ? `${lang === 'ar' ? 'آخر نسخة:' : 'Last backup:'} ${dateStr}`
                : t('settings.neverBacked')}
            </p>
            {days !== null && (
              <p style={{ fontSize: 12, color: days > 7 ? '#dc2626' : '#8089A0', margin: '2px 0 0' }}>
                {days === 0
                  ? (lang === 'ar' ? 'اليوم' : 'Today')
                  : `${days} ${lang === 'ar' ? 'أيام مضت' : 'days ago'}`}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleBackup}
          style={{
            background: loading ? '#a7d4c5' : '#0E9B73',
            color: '#fff', border: 'none', borderRadius: 10,
            padding: '10px 20px', fontSize: 14, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
          }}
        >
          {loading ? <Spinner size="sm" /> : <IconDownload />}
          {loading
            ? (lang === 'ar' ? 'جارٍ التنزيل...' : 'Downloading...')
            : (lang === 'ar' ? 'تنزيل نسخة احتياطية' : 'Download backup now')}
        </button>
      </div>

      {notice && (
        <p style={{ fontSize: 13, color: notice.ok ? '#16a34a' : '#dc2626', marginTop: 10 }}>
          {notice.ok ? '✓ ' : '✗ '}{notice.text}
        </p>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Settings() {
  const { t, lang }     = useI18n();
  const [section, setSection] = useState('security');
  const [lastBackup, setLastBackup] = useState(localStorage.getItem(BACKUP_KEY) || '');

  const navLabels = {
    security:   lang === 'ar' ? 'الأمان'         : 'Security',
    centerInfo: lang === 'ar' ? 'معلومات المركز' : 'Center info',
    theme:      lang === 'ar' ? 'المظهر'         : 'Theme',
    categories: lang === 'ar' ? 'الفئات'         : 'Categories',
    backup:     lang === 'ar' ? 'النسخ الاحتياطي': 'Backup',
  };

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'stretch' }}>

      {/* Left nav */}
      <div className="leen-card" style={{
        width: 185, flexShrink: 0, background: '#fff',
        border: '1px solid #E6EAF1', borderRadius: 16, padding: 10,
      }}>
        {NAV_ITEMS.map(({ id, Icon }) => {
          const active = section === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '9px 12px', borderRadius: 10,
                border: 'none', cursor: 'pointer', textAlign: 'start',
                background: active ? '#E6F6F0' : 'transparent',
                color: active ? '#0E9B73' : '#2A3344',
                fontWeight: active ? 600 : 400,
                fontSize: 14,
                transition: 'background .12s, color .12s',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#F7F8FB'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon />
              {navLabels[id]}
            </button>
          );
        })}
      </div>

      {/* Right panel */}
      <div className="leen-card" style={{
        flex: 1, minWidth: 0, background: '#fff',
        border: '1px solid #E6EAF1', borderRadius: 16, padding: 28,
      }}>
        {section === 'security'    && <SecurityPanel    t={t} lang={lang} />}
        {section === 'centerInfo'  && <CenterInfoPanel  t={t} />}
        {section === 'theme'       && <ThemePanel       t={t} />}
        {section === 'categories'  && <CategoriesPanel  t={t} lang={lang} />}
        {section === 'backup'      && (
          <BackupPanel
            t={t} lang={lang}
            lastBackup={lastBackup}
            onBackupDone={(d) => { localStorage.setItem(BACKUP_KEY, d); setLastBackup(d); }}
          />
        )}
      </div>

    </div>
  );
}
