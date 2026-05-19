# Leen Psychotherapy Center — Project Context
# ============================================
# Read this file fully at the start of EVERY Claude Code session.
# Update the "Current State" section after every major change.
# This file lives in the root of BOTH repos — leen-booking and leen-admin.

---

## Project Identity

- **Center name:** Leen Psychotherapy Center
- **Project type:** Two PWA web apps + Google Sheets backend
- **Developer:** Khaled — Telecom Department, Landmark Plus (LMP)
- **Language:** Bilingual — Arabic (RTL) and English (LTR)
- **Currency:** EGP (Egyptian Pounds)
- **Timezone:** Africa/Cairo
- **Target users:** Clients (booking app) and Center admin (admin app)

---

## Architecture Overview

Three components, zero server costs:

| Component       | Type            | Hosting                        | Tech                    |
|-----------------|-----------------|--------------------------------|-------------------------|
| leen-booking    | Client PWA      | GitHub Pages (public repo)     | React 18 + Vite + HeroUI|
| leen-admin      | Admin PWA       | GitHub Pages (public repo)     | React 18 + Vite + HeroUI|
| Leen Backend    | Sheet + Script  | Google Drive (private)         | Google Apps Script      |

**Data flow — booking:**
Client submits booking → POST to Apps Script → writes to Bookings tab →
emails admin → admin PWA polls every 60s → shows pending badge → admin confirms →
Apps Script emails client confirmation

**Data flow — financials:**
Admin logs expense/transaction in admin PWA → POST to Apps Script →
writes to Expenses or Transactions tab → dashboard re-fetches on next load

---

## Tech Stack

- **Framework:** React 18 + Vite
- **UI Library:** HeroUI v3 (@heroui/react)
- **Styling:** Tailwind CSS v4 (bundled with HeroUI)
- **Routing:** React Router v6
- **Charts:** Recharts (admin app only)
- **Excel export:** SheetJS (xlsx)
- **PWA:** vite-plugin-pwa
- **Animations:** Framer Motion (bundled with HeroUI)
- **Backend:** Google Apps Script (deployed as web app)
- **Database:** Google Sheets (1 file, 7 tabs)
- **Hosting:** GitHub Pages via GitHub Actions (auto-deploy on push to main)
- **Dev command:** `npm run dev` → localhost:5173
- **Build command:** `npm run build` → /dist folder
- **Deploy:** push to main → GitHub Actions builds and deploys automatically

---

## HeroUI Theme — Leen Design System

Configured in tailwind.config.js in both repos.
Primary color: calm teal green. Secondary: soft purple.

```js
// tailwind.config.js
import { heroui } from "@heroui/react";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: { extend: {} },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              50:  "#E8F7F2",
              100: "#C5EBE0",
              200: "#8ED6C0",
              300: "#57C1A0",
              400: "#2DAE88",
              500: "#0E9B73",
              600: "#0B7D5D",
              700: "#085F47",
              800: "#054030",
              900: "#022018",
              DEFAULT: "#0E9B73",
              foreground: "#FFFFFF",
            },
            secondary: {
              DEFAULT: "#7C6FCD",
              foreground: "#FFFFFF",
            },
          },
        },
      },
    }),
  ],
};
```

---

## Google Sheet Structure

**File name:** Leen Center — Backend
**Location:** Google Drive (private, never shared publicly)
**Structure:** 1 Google Sheet file with 7 tabs

---

### Tab 1: Bookings
One row per booking request. Auto-ID format: B-2024-001

| Column            | Type     | Notes                                                      |
|-------------------|----------|------------------------------------------------------------|
| Booking_ID        | Text     | Auto: B-YYYY-001                                           |
| Submitted_At      | DateTime | Auto: timestamp when client submitted                      |
| Session_Date      | Date     | Date client selected                                       |
| Session_Time      | Text     | e.g. 10:00                                                 |
| Therapist_ID      | Text     | Links to Therapists tab                                    |
| Therapist_Name    | Text     | Copied at booking time                                     |
| Client_ID         | Text     | Links to Clients tab — auto-created if new phone number    |
| Client_Name       | Text     | As entered by client                                       |
| Client_Phone      | Text     | Required — used to detect returning clients                |
| Client_Email      | Text     | Optional                                                   |
| Session_Type      | Text     | Individual / Couples / Family / Group / Workshop           |
| Session_Mode      | Text     | In-person / Online                                         |
| Fee               | Number   | EGP — copied from Therapists tab at booking time           |
| Revenue_Therapist | Number   | Formula: Fee × (Revenue_Share_Pct / 100)                   |
| Revenue_Center    | Number   | Formula: Fee − Revenue_Therapist                           |
| Status            | Text     | Pending / Confirmed / Cancelled / Completed / No-show      |
| Payment_Status    | Text     | Unpaid / Paid / Waived                                     |
| Payment_Method    | Text     | Cash / Bank transfer                                       |
| Video_Link        | Text     | Optional — Daily.co room URL for online sessions           |
| Reminder_Sent     | Boolean  | FALSE → TRUE after daily trigger fires                     |
| Confirmed_At      | DateTime | Auto: set when admin confirms                              |
| Notes             | Text     | Admin-only notes                                           |

---

### Tab 2: Therapists
One row per therapist. Auto-ID format: T-001

| Column               | Type     | Notes                                          |
|----------------------|----------|------------------------------------------------|
| Therapist_ID         | Text     | Primary key: T-001, T-002…                     |
| Name_EN              | Text     | Full name in English                           |
| Name_AR              | Text     | Full name in Arabic                            |
| Title_EN             | Text     | e.g. Clinical Psychologist                     |
| Title_AR             | Text     | Arabic title                                   |
| Bio_EN               | LongText | Shown on profile in client app                 |
| Bio_AR               | LongText | Arabic bio                                     |
| Specialties          | Text     | Comma-separated: Anxiety, Depression, CBT      |
| Session_Types        | Text     | Comma-separated: Individual, Couples, Family   |
| Modes                | Text     | In-person / Online / Both                      |
| Languages            | Text     | Arabic, English                                |
| Revenue_Share_Pct    | Number   | e.g. 70 (therapist gets 70%)                   |
| Fee_Individual       | Number   | EGP                                            |
| Fee_Couples          | Number   | EGP                                            |
| Fee_Family           | Number   | EGP                                            |
| Working_Days         | Text     | Comma-separated: Sun,Mon,Tue,Wed,Thu            |
| Start_Time           | Text     | e.g. 09:00                                     |
| End_Time             | Text     | e.g. 17:00                                     |
| Session_Duration_Min | Number   | 50 default                                     |
| Photo_URL            | Text     | Optional — Google Drive image link             |
| Display_Order        | Number   | Controls order in client app                   |
| Active               | Boolean  | FALSE hides therapist from client app instantly|
| Joined_Date          | Date     |                                                |

---

### Tab 3: Availability
Exceptions only — blocked dates and one-off extra slots.
Regular schedule is defined in the Therapists tab (Working_Days, Start_Time, End_Time).
Apps Script calculates available slots by combining regular schedule minus exceptions.

| Column       | Type | Notes                                    |
|--------------|------|------------------------------------------|
| Exception_ID | Text | Auto-generated                           |
| Therapist_ID | Text | Links to Therapists tab                  |
| Date         | Date | The affected date                        |
| Time_Start   | Text | Leave blank = full day affected          |
| Time_End     | Text | Leave blank = full day affected          |
| Type         | Text | Blocked / Extra_Available                |
| Reason       | Text | Holiday, Sick, Conference… (admin only)  |

---

### Tab 4: Transactions
Full cash in / cash out log. Replaces the bank Excel sheet.
Auto-ID format: TXN-2024-001

| Column         | Type     | Notes                                                             |
|----------------|----------|-------------------------------------------------------------------|
| Transaction_ID | Text     | Auto: TXN-YYYY-001                                                |
| Date           | Date     |                                                                   |
| Description    | Text     | e.g. "Individual session – Lujain"                                |
| Category       | Text     | Revenue / Salary / Rent / Marketing / Admin / Initial_Cost / Other|
| Sub_Category   | Text     | e.g. Revenue Share, Cleaning, Ads                                 |
| Cash_In        | Number   | EGP — leave blank if outgoing                                     |
| Cash_Out       | Number   | EGP — leave blank if incoming                                     |
| Balance        | Number   | Formula: running total from row above                             |
| Method         | Text     | Cash / Bank transfer                                              |
| Booking_ID     | Text     | Optional — links to Bookings tab                                  |
| Notes          | Text     |                                                                   |
| Created_At     | DateTime | Auto                                                              |

---

### Tab 5: Expenses
Administrative expense tracking. Replaces the admin expenses Excel sheet.
Auto-ID format: EXP-2024-001

| Column       | Type   | Notes                                                                      |
|--------------|--------|----------------------------------------------------------------------------|
| Expense_ID   | Text   | Auto: EXP-YYYY-001                                                         |
| Date         | Date   |                                                                            |
| Month        | Text   | Formula: e.g. 2024-01 — for monthly grouping                               |
| Category     | Text   | Cleaning / Coffee & Break / Facilities / Marketing / Salary / Initial Cost / Other |
| Item         | Text   | e.g. "Floor cleaning soap 5kg"                                             |
| Expected_EGP | Number | Budget amount                                                              |
| Actual_EGP   | Number | What was actually spent                                                    |
| Variance     | Number | Formula: Actual_EGP − Expected_EGP                                         |
| Paid_By      | Text   | Cash / Bank transfer                                                       |
| Notes        | Text   |                                                                            |

---

### Tab 6: Clients
Auto-created on first booking. Never manually added.
Auto-ID format: C-001

| Column                | Type     | Notes                                             |
|-----------------------|----------|---------------------------------------------------|
| Client_ID             | Text     | Auto: C-001                                       |
| Name                  | Text     |                                                   |
| Phone                 | Text     | Used to detect returning clients on next booking  |
| Email                 | Text     | Optional                                          |
| First_Session_Date    | Date     | Auto: set on first booking                        |
| Preferred_Therapist_ID| Text     | Links to Therapists tab                           |
| Total_Sessions        | Number   | COUNTIF on Bookings tab                           |
| Status                | Text     | Active / Inactive                                 |
| Notes                 | Text     | Admin-only — never exposed to client app          |
| Added_At              | DateTime | Auto                                              |

---

### Tab 7: Settings
Key-value config. Read by Apps Script. Edit here without touching code.

| Key                   | Example Value           | Purpose                                     |
|-----------------------|-------------------------|---------------------------------------------|
| ADMIN_EMAIL           | admin@leen.com          | Receives new booking alert emails           |
| CENTER_NAME           | Leen Psychotherapy Center | Appears in notification emails             |
| CENTER_PHONE          | +20 10 XXXX XXXX        | Shown in client app confirmation screen     |
| BOOKING_WINDOW_DAYS   | 30                      | How many days ahead clients can book        |
| REMINDER_HOURS_BEFORE | 24                      | When to send session reminder to client     |
| SLOT_DURATION_MIN     | 50                      | Default slot length (overridden per therapist)|
| CURRENCY              | EGP                     | Shown in emails and dashboard               |
| TIMEZONE              | Africa/Cairo            | Used by all date/time triggers              |
| ADMIN_USERNAME        | admin                   | Login username                              |
| ADMIN_PASSWORD_HASH   | [SHA-256 hash]          | Hashed password — updated via admin app     |
| LAST_BACKUP_DATE      | 2024-01-15              | Updated when admin runs backup              |

---

## Apps Script Endpoints

**File:** One Apps Script file attached to the Google Sheet
**Deployed as:** Web app (Execute as Me, Anyone can access)
**Base URL:** Stored in src/api.js as `APPS_SCRIPT_URL` constant
**Security:** Referrer check — rejects all requests not from GitHub Pages domain

### Referrer check (top of every doGet/doPost):
```js
const ALLOWED_ORIGIN = 'https://[your-github-username].github.io';
function checkOrigin(e) {
  const origin = (e.parameter && e.parameter.origin) || '';
  return origin.startsWith(ALLOWED_ORIGIN);
}
```

### GET endpoints (action parameter):
| Action                   | Parameters           | Returns                                        |
|--------------------------|----------------------|------------------------------------------------|
| getTherapists            | —                    | All active therapists (for client app)         |
| getAvailableSlots        | therapistId, date    | Available time slots for that day              |
| getDashboardData         | month, year          | Revenue, expenses, session counts              |
| getSessions              | month, year, therapistId (optional) | Session list with revenue split  |
| getTransactions          | month, year          | Cash in/out log with running balance           |
| getExpenses              | month, year          | Expense list                                   |
| getPayouts               | month, year          | Therapist payout data                          |
| getClients               | —                    | Full client directory                          |
| getTherapistsFull        | —                    | Full therapist data for admin management       |
| backup                   | —                    | All financial data as one JSON object          |

### POST endpoints (action in request body):
| Action           | Purpose                                              |
|------------------|------------------------------------------------------|
| submitBooking    | Writes to Bookings tab, emails admin                 |
| confirmBooking   | Updates status to Confirmed, emails client           |
| cancelBooking    | Updates status to Cancelled, emails client           |
| addTransaction   | Writes to Transactions tab                           |
| addExpense       | Writes to Expenses tab                               |
| markPaid         | Updates Payment_Status on booking                    |
| updateTherapist  | Updates therapist row in Therapists tab              |
| blockDate        | Writes to Availability tab                           |
| markPayoutPaid   | Records payout as settled                            |
| updateSettings   | Writes key-value to Settings tab                     |
| updatePassword   | Writes new SHA-256 hash to Settings tab              |

---

## Security Model

- Apps Script URL: private — never committed in plain text if repo is public.
  Store as: `const APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_ID/exec";`
  Replace YOUR_ID with actual ID before building.
- Apps Script referrer check: rejects requests not from GitHub Pages domain.
- Admin app: SHA-256 password hashed in browser via Web Crypto API.
  Hash checked against Settings tab value on login.
- Admin session: token stored in sessionStorage — expires when browser closes.
- Client app: no login, no auth. Only exposes therapist info and booking submission.
- Financial data: never in any GitHub repo. Lives exclusively in Google Drive.
- Never commit real data as test values in code.

---

## Repo 1: leen-booking

**Purpose:** Client-facing PWA. Browse therapists and book sessions.
**URL:** https://[username].github.io/leen-booking
**No login required.** No payment. Booking only.

### Screens (8 total)

1. **Home** — Leen logo, short center intro, language toggle, "Book a session" CTA button
2. **Therapists** — Card list of active therapists. Filter pills by session type. Fee + mode badge on each card.
3. **TherapistProfile** — Full bio (AR/EN), specialties, fees per session type, available days, Book button
4. **SlotPicker** — Calendar (available days only). Time slot grid. Session type selector. In-person/Online toggle. Fee updates dynamically.
5. **BookingForm** — Booking summary at top. Fields: Name (required), Phone (required), Email (optional), Notes (optional). Submit button.
6. **Confirmation** — Success message. Booking summary. "We'll confirm within 24 hours." Center phone. "Add to calendar" link. "Book another" button.
7. **InstallPrompt** — Small banner on second visit. "Add to home screen." Dismissable. Different instructions for iOS vs Android.
8. **Offline** — Shown by service worker when no connection. Retry button. Center phone as fallback.

### File Structure
```
leen-booking/
  CLAUDE.md
  BUILD.md
  package.json
  vite.config.js
  tailwind.config.js
  index.html
  public/
    manifest.json
    sw.js
    icons/
      icon-192.png
      icon-512.png
  src/
    main.jsx            ← React entry: HeroUIProvider + RouterProvider
    App.jsx             ← Route definitions
    api.js              ← All Apps Script fetch calls
    i18n.js             ← All AR/EN translation strings
    pages/
      Home.jsx
      Therapists.jsx
      TherapistProfile.jsx
      SlotPicker.jsx
      BookingForm.jsx
      Confirmation.jsx
    components/
      TherapistCard.jsx   ← Used on Therapists page
      SlotGrid.jsx        ← Used on SlotPicker page
      LanguageToggle.jsx  ← EN/AR toggle button — used in all pages
      InstallPrompt.jsx   ← PWA install banner
      OfflineScreen.jsx   ← Shown by service worker
      LoadingSpinner.jsx  ← HeroUI Spinner wrapper
    assets/
      logo.svg
```

### Booking state (passed between screens via React Router state):
```js
{
  therapist: { id, name, fee, mode },
  date: "2024-01-15",
  time: "10:00",
  sessionType: "Individual",
  sessionMode: "In-person",
  fee: 1000
}
```

---

## Repo 2: leen-admin

**Purpose:** Admin PWA. Full financial tracking, session management, therapist profiles, client directory.
**URL:** https://[username].github.io/leen-admin
**Password protected.** Responsive — desktop sidebar + mobile bottom nav.

### Login
- SHA-256 hash password against Settings tab value.
- Session stored in sessionStorage.
- All pages redirect to /login if no valid session.

### Modules (8 + Login + Settings = 10 pages total)

1. **Login** — Username + password. Error message on wrong credentials.
2. **Dashboard** — Today's sessions count, today's revenue, pending bookings count. Pending booking cards with Confirm/Cancel buttons. Monthly revenue line chart (Recharts). Recent activity list. "Last backup: X days ago" reminder.
3. **Sessions** — Full bookings table. Filters: therapist, date range, status, payment status. Per-row: confirm, cancel, mark paid actions. Revenue split (therapist / center) shown per row. Export to Excel.
4. **CashFlow** — Transaction log table. Add transaction form (inline panel). Running balance always visible. Filter by category, method, month. Monthly totals summary. Export to Excel.
5. **Expenses** — Expense log table. Add expense form. Expected vs actual per category. Monthly view selector. Category breakdown bar chart (Recharts). Flag over-budget categories in red. Export to Excel.
6. **Payouts** — Per-therapist cards showing: total earned this month, paid out, pending. Sessions breakdown per therapist. Mark payout as settled. Payout history log. Export payout report.
7. **TherapistMgmt** — Therapist list. Click to expand edit form per therapist. Fields: bio EN/AR, fees, working days, start/end time, revenue share %, session types, modes, active toggle. Block date form.
8. **Clients** — Client directory table. Search by name or phone. Click row to expand: full session history, preferred therapist, admin notes, total sessions, last session date.
9. **Reports** — Month/year selector. Generates: income statement (revenue vs expenses = net), year-to-date revenue chart. Export buttons: sessions Excel, expenses Excel, payout report Excel.
10. **Settings** — Change password (old + new + confirm). Center info display. JSON backup button (downloads leen-backup-YYYY-MM-DD.json). Last backup date shown. Backup reminder if >7 days.

### Responsive layout:
- Desktop (≥768px): persistent left sidebar navigation, multi-column layouts, full tables
- Mobile (<768px): top bar with page title, bottom tab navigation (thumb-friendly), single column, cards instead of wide tables

### File Structure
```
leen-admin/
  CLAUDE.md
  BUILD.md
  package.json
  vite.config.js
  tailwind.config.js
  index.html
  public/
    manifest.json
    sw.js
    icons/
      icon-192.png
      icon-512.png
  src/
    main.jsx            ← HeroUIProvider + RouterProvider
    App.jsx             ← Routes — all wrapped in AuthGuard except /login
    api.js              ← All Apps Script fetch calls
    i18n.js             ← All AR/EN translation strings
    auth.js             ← hashPassword(), login(), logout(), isAuthenticated()
    pages/
      Login.jsx
      Dashboard.jsx
      Sessions.jsx
      CashFlow.jsx
      Expenses.jsx
      Payouts.jsx
      TherapistMgmt.jsx
      Clients.jsx
      Reports.jsx
      Settings.jsx
    components/
      AppShell.jsx        ← Wraps all protected pages. Renders Sidebar (desktop) or BottomNav+TopBar (mobile)
      Sidebar.jsx         ← Desktop: vertical nav with icons + labels
      BottomNav.jsx       ← Mobile: 5-tab bottom navigation
      TopBar.jsx          ← Mobile: top bar with page title + logout icon
      AuthGuard.jsx       ← Redirects to /login if not authenticated
      StatCard.jsx        ← Reusable: icon + value + label tile
      DataTable.jsx       ← Reusable: sortable, filterable table with pagination
      RevenueChart.jsx    ← Recharts LineChart wrapper
      ExpenseChart.jsx    ← Recharts BarChart wrapper
      LanguageToggle.jsx  ← EN/AR toggle
      LoadingSpinner.jsx  ← HeroUI Spinner wrapper
      ConfirmModal.jsx    ← Reusable confirm dialog
      BackupButton.jsx    ← Fetches backup data, triggers JSON download
    assets/
      logo.svg
```

---

## Bilingual Support (both repos)

- Language toggle: EN ↔ AR stored in localStorage key `leen_lang`
- RTL applied via `document.documentElement.setAttribute('dir', 'rtl')` when Arabic
- All UI strings defined in `src/i18n.js` — never hardcode display text in components
- Usage in components: `const { t, lang } = useI18n()` via a custom hook
- Numbers and monetary values always LTR even in RTL mode — use `dir="ltr"` on those spans
- HeroUI components support RTL natively via CSS logical properties
- Date format: "15 يناير 2024" in Arabic, "15 Jan 2024" in English

### i18n.js structure:
```js
export const translations = {
  en: {
    nav: { dashboard: "Dashboard", sessions: "Sessions", ... },
    actions: { confirm: "Confirm", cancel: "Cancel", save: "Save", ... },
    booking: { bookSession: "Book a Session", selectDate: "Select a date", ... },
    // ... all strings
  },
  ar: {
    nav: { dashboard: "الرئيسية", sessions: "الجلسات", ... },
    actions: { confirm: "تأكيد", cancel: "إلغاء", save: "حفظ", ... },
    booking: { bookSession: "احجز جلسة", selectDate: "اختر تاريخاً", ... },
    // ... all strings
  }
}

export function useI18n() {
  const [lang, setLang] = useState(localStorage.getItem('leen_lang') || 'ar');
  const t = (key) => key.split('.').reduce((obj, k) => obj?.[k], translations[lang]) || key;
  const toggleLang = () => { const nl = lang === 'ar' ? 'en' : 'ar'; setLang(nl); localStorage.setItem('leen_lang', nl); };
  return { t, lang, toggleLang };
}
```

---

## Utility Functions (shared pattern in both repos)

Define in `src/utils.js`:

```js
// Format currency — always EGP, always LTR
formatCurrency(amount) → "1,500 EGP"

// Format date — user-friendly
formatDate(dateStr, lang) → "15 Jan 2024" or "15 يناير 2024"

// Generate booking ID
generateId(prefix, existingIds) → "B-2024-047"

// Hash password for admin login
async hashPassword(password) → SHA-256 hex string via Web Crypto API

// Trigger file download
downloadJSON(data, filename) → triggers browser download of .json file
downloadExcel(workbook, filename) → SheetJS download
```

---

## Key Rules for Claude Code

1. Always read CLAUDE.md fully at the start of every session.
2. Never hardcode display strings — always use the `t()` function from useI18n().
3. Never hardcode the Apps Script URL — always use the `APPS_SCRIPT_URL` constant from api.js.
4. Always handle loading states (HeroUI Spinner) and error states in every API call.
5. Format all monetary values as "1,500 EGP" using formatCurrency() — always LTR direction.
6. Use HeroUI components (Button, Card, Table, Input, Modal, Select…) — avoid raw HTML elements for UI.
7. Admin app: wrap all protected routes in AuthGuard. Check isAuthenticated() before rendering.
8. Mobile-first: every component must work at 390px width before considering desktop layout.
9. Split large components: if a file exceeds 150 lines, extract sub-components.
10. After every completed step, update the "Current State" section at the bottom of this file.
11. Never commit sensitive data, real names, or real phone numbers as test values.
12. All API calls go through api.js — no fetch() calls directly in page components.
13. Recharts and SheetJS are admin-only — do not import them in leen-booking.

---

## GitHub Actions — Auto Deploy

Both repos use the same workflow file at `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Important — vite.config.js base URL:**
- leen-booking: `base: '/leen-booking/'`
- leen-admin: `base: '/leen-admin/'`

---

## Before Starting Each Session

1. Open the correct repo folder in VS Code (leen-booking OR leen-admin)
2. Run `npm run dev` to start local preview at localhost:5173
3. Tell Claude Code: "Read CLAUDE.md fully. We are working on [leen-booking / leen-admin]. Continue from Step [X]."

---

## Current State

**Last updated:** [fill in date]

| Component      | Status       | Notes                    |
|----------------|--------------|--------------------------|
| Google Sheet   | Not created  |                          |
| Apps Script    | Not deployed |                          |
| leen-booking   | Not started  |                          |
| leen-admin     | Not started  |                          |

### leen-booking completed steps:
- [ ] None yet

### leen-admin completed steps:
- [ ] None yet

### Next step:
→ Create Google Sheet with 7 tabs
→ Then start leen-booking Stage 1-A
