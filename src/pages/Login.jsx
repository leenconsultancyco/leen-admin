import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input, Spinner } from '@heroui/react';
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
              <Input
                label={t('login.username')}
                value={username}
                onValueChange={setUsername}
                isRequired
                autoComplete="username"
                isDisabled={loading}
              />

              <Input
                label={t('login.password')}
                type={showPwd ? 'text' : 'password'}
                value={password}
                onValueChange={setPassword}
                isRequired
                autoComplete="current-password"
                isDisabled={loading}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="text-default-400 text-lg leading-none focus:outline-none"
                    tabIndex={-1}
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                  >
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                }
              />

              {error && (
                <div role="alert" className="text-sm text-danger bg-danger-50 border border-danger-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                color="primary"
                fullWidth
                isDisabled={loading || !username || !password}
                startContent={loading ? <Spinner size="sm" color="white" /> : undefined}
              >
                {loading ? t('general.loading') : t('login.signIn')}
              </Button>
            </form>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
