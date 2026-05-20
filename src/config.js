// Apps Script URL entered by admin in Settings — never hardcoded in source.
// Stored in localStorage so it survives page reloads without a build step.
export const APPS_SCRIPT_URL = localStorage.getItem('leen_script_url') || '';
export const ORIGIN = window.location.origin;
