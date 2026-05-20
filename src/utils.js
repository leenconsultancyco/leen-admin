// ---------------------------------------------------------------------------
// Currency
// ---------------------------------------------------------------------------

export function formatCurrency(amount) {
  return `${Number(amount || 0).toLocaleString('en-EG')} EGP`;
}

// ---------------------------------------------------------------------------
// Date
// ---------------------------------------------------------------------------

const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const EN_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function formatDate(dateStr, lang = 'en') {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const months = lang === 'ar' ? AR_MONTHS : EN_MONTHS;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('leen_theme', theme);
}

export function initTheme() {
  const saved = localStorage.getItem('leen_theme') || 'teal';
  applyTheme(saved);
  return saved;
}

export const THEMES = ['teal', 'navy', 'blue', 'green', 'red', 'purple'];

export const THEME_LABELS = {
  teal:   { en: 'Teal',      ar: 'أخضر مائي' },
  navy:   { en: 'Navy Blue', ar: 'أزرق داكن' },
  blue:   { en: 'Blue',      ar: 'أزرق'      },
  green:  { en: 'Green',     ar: 'أخضر'      },
  red:    { en: 'Red',       ar: 'أحمر'       },
  purple: { en: 'Purple',    ar: 'بنفسجي'    },
};

// ---------------------------------------------------------------------------
// Downloads
// ---------------------------------------------------------------------------

export function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Visit counter (for PWA install prompt)
// ---------------------------------------------------------------------------

export function getVisitCount() {
  const count = Number(localStorage.getItem('leen_visit_count') || 0) + 1;
  localStorage.setItem('leen_visit_count', count);
  return count;
}

// ---------------------------------------------------------------------------
// Google Calendar link
// ---------------------------------------------------------------------------

export function generateCalendarLink(booking) {
  const start = `${booking.Session_Date}T${booking.Session_Time}:00`;
  const params = new URLSearchParams({
    action:  'TEMPLATE',
    text:    `Leen — ${booking.Session_Type} Session`,
    dates:   `${start.replace(/[-:]/g, '')}/${start.replace(/[-:]/g, '')}`,
    details: `Therapist: ${booking.Therapist_Name}\nMode: ${booking.Session_Mode}`,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
