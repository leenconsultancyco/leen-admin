import { APPS_SCRIPT_URL, ORIGIN } from './config';

const SESSION_KEY = 'leen_admin_session';

export async function hashPassword(password) {
  const encoded = new TextEncoder().encode(password);
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function login(username, password) {
  const passwordHash = await hashPassword(password);

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'verifyLogin', origin: ORIGIN, username, passwordHash }),
    });
    const result = await res.json();

    if (result.success) {
      const token = btoa(`${username}:${Date.now()}`);
      sessionStorage.setItem(SESSION_KEY, token);
      return { success: true };
    }

    return { success: false, error: 'Invalid credentials' };
  } catch {
    return { success: false, error: 'Connection error — please try again' };
  }
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = '/leen-admin/';
}

export function isAuthenticated() {
  return !!sessionStorage.getItem(SESSION_KEY);
}

export function getAdminUsername() {
  const token = sessionStorage.getItem(SESSION_KEY);
  if (!token) return null;
  try {
    return atob(token).split(':')[0];
  } catch {
    return null;
  }
}
