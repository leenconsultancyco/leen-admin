import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input, Label, Spinner } from '@heroui/react';
import { login, isAuthenticated } from '../auth';
import { useI18n } from '../i18n';
import LanguageToggle from '../components/LanguageToggle';

export default function Login() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (isAuthenticated()) navigate('/dashboard', { replace: true });
  }, [navigate]);

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
              <div className="flex flex-col gap-1">
                <Label htmlFor="username">{t('login.username')}</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="password">{t('login.password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={loading}
                    className="pe-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute inset-y-0 end-2 flex items-center text-default-400 text-lg focus:outline-none"
                    tabIndex={-1}
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                  >
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" className="text-sm text-danger bg-danger-50 border border-danger-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isDisabled={loading || !username || !password}
              >
                {loading ? <><Spinner size="sm" /> {t('general.loading')}</> : t('login.signIn')}
              </Button>
            </form>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
