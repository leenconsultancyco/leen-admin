import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Spinner } from '@heroui/react';
import { login, isAuthenticated } from '../auth';
import { useI18n } from '../i18n';
import LanguageToggle from '../components/LanguageToggle';

const URL_KEY = 'leen_script_url';

const INP = {
  display: 'block', width: '100%', borderWidth: '2px', borderStyle: 'solid',
  borderColor: '#9ca3af', borderRadius: '8px', padding: '10px 16px',
  backgroundColor: '#ffffff', color: '#111827', fontSize: '16px',
  marginBottom: '8px', boxSizing: 'border-box', outline: 'none',
};

// ── Setup screen shown on first launch (no URL saved in localStorage) ───────
function SetupScreen({ t }) {
  const [url, setUrl] = useState('');

  function save() {
    const trimmed = url.trim();
    if (!trimmed.startsWith('https://script.google.com')) return;
    localStorage.setItem(URL_KEY, trimmed);
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-default-50 flex flex-col">
      <div className="flex justify-end p-4"><LanguageToggle /></div>
      <div className="flex-1 flex items-center justify-center px-4">
        <Card className="w-full max-w-sm shadow-lg">
          <Card.Content className="gap-5 p-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">ليـن</p>
              <p className="text-sm text-default-400 mt-1">Leen Psychotherapy Center</p>
            </div>
            <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#713f12' }}>
              <p style={{ fontWeight: 700, marginBottom: '4px' }}>⚙️ {t('settings.setupRequired')}</p>
              <p>{t('settings.setupDesc')}</p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                {t('settings.backendUrl')}
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/..."
                style={INP}
              />
            </div>
            <Button
              color="primary"
              className="w-full"
              isDisabled={!url.trim().startsWith('https://script.google.com')}
              onPress={save}
            >
              Connect & Continue
            </Button>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}

// ── Main login form ──────────────────────────────────────────────────────────
export default function Login() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const hasUrl = !!localStorage.getItem(URL_KEY);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (isAuthenticated()) navigate('/dashboard', { replace: true });
  }, [navigate]);

  // Show setup screen if no URL is configured yet (new device / first launch)
  if (!hasUrl) return <SetupScreen t={t} />;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username || !password) return;
    setError('');
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.error || t('login.invalidCredentials'));
    }
  }

  return (
    <div className="min-h-screen bg-default-50 flex flex-col">
      <div className="flex justify-end p-4">
        <LanguageToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <Card className="w-full max-w-sm shadow-lg">
          <Card.Content className="gap-6 p-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">ليـن</p>
              <p className="text-sm text-default-400 mt-1">Leen Psychotherapy Center</p>
              <p className="text-xs text-default-300 mt-0.5">{t('login.title')}</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 w-full">
                <label htmlFor="username" style={{ fontSize: '13px', color: '#6b7280' }}>{t('login.username')}</label>
                <input
                  id="username" type="text" value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin" autoComplete="username" required
                  style={INP}
                />
              </div>

              <div className="flex flex-col gap-1 w-full">
                <label htmlFor="password" style={{ fontSize: '13px', color: '#6b7280' }}>{t('login.password')}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password" type={showPwd ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password" required
                    style={{ ...INP, paddingRight: '44px' }}
                  />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowPwd(v => !v)}
                    style={{ position: 'absolute', top: 0, bottom: 0, right: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#9ca3af' }}
                    aria-label={showPwd ? 'Hide' : 'Show'}>
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" style={{ fontSize: '13px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '8px 12px' }}>
                  {error}
                </div>
              )}

              <Button type="submit" variant="primary" className="w-full"
                isDisabled={loading || !username || !password}>
                {loading ? <><Spinner size="sm" /> {t('general.loading')}</> : t('login.signIn')}
              </Button>
            </form>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
