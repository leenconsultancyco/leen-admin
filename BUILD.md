# Leen Psychotherapy Center — Build Guide
# =========================================
# How to use this file:
# Each step has one prompt block — copy it and paste it into Claude Code (VS Code).
# One prompt = one file. This keeps every prompt fast and prevents token interruptions.
# Always complete and verify each step before moving to the next.
# CLAUDE.md in the repo root gives Claude Code full context automatically.

---

## Before You Start — One-Time Setup

### Google Sheet Setup (do this first, before any coding)
1. Go to Google Drive → New → Google Sheets → name it "Leen Center — Backend"
2. Create 7 tabs: Bookings, Therapists, Availability, Transactions, Expenses, Clients, Settings
3. Add the column headers to each tab exactly as defined in CLAUDE.md
4. In the Settings tab, add the key-value rows defined in CLAUDE.md
5. Add at least 2 sample therapists to the Therapists tab
6. Go to Extensions → Apps Script → this opens the script editor (keep this tab open)
7. You will deploy the Apps Script in Stage 7 after it is built

### Repo Setup (do this before each repo)
1. Create a new GitHub repo (leen-booking then leen-admin — do them one at a time)
2. Clone it locally to your computer
3. Open the folder in VS Code
4. Place CLAUDE.md in the repo root
5. Place BUILD.md in the repo root
6. Follow the stages below in order

---

## ═══════════════════════════════════════════
## REPO 1: leen-booking (Client Booking PWA)
## ═══════════════════════════════════════════

## ─────────────────────────────────────────
## STAGE 1 — Foundation & Configuration
## ─────────────────────────────────────────

### Step 1-A — package.json

```
Read CLAUDE.md fully.

Create package.json for the leen-booking React + Vite + HeroUI project.

Include these exact dependencies:
- react: ^18.3.0
- react-dom: ^18.3.0
- react-router-dom: ^6.23.0
- @heroui/react: ^2.4.0
- framer-motion: ^11.0.0

Include these exact devDependencies:
- vite: ^5.3.0
- @vitejs/plugin-react: ^4.3.0
- tailwindcss: ^4.0.0
- vite-plugin-pwa: ^0.20.0
- autoprefixer: ^10.4.0

Scripts:
- dev: vite
- build: vite build
- preview: vite preview

Name: leen-booking
Version: 1.0.0
Private: true
```

---

### Step 1-B — vite.config.js

```
Read CLAUDE.md fully.

Create vite.config.js for leen-booking.

Include:
- @vitejs/plugin-react plugin
- vite-plugin-pwa plugin with these PWA options:
  registerType: 'autoUpdate'
  manifest: false (we use our own public/manifest.json)
  workbox:
    globPatterns: ['**/*.{js,css,html,ico,png,svg}']
    runtimeCaching for the Apps Script URL with NetworkFirst strategy,
    cacheName 'api-cache', expiration maxEntries 50, maxAgeSeconds 300
- base: '/leen-booking/' (required for GitHub Pages subdirectory hosting)
- build output: dist folder
- resolve alias: @ → /src
```

---

### Step 1-C — tailwind.config.js

```
Read CLAUDE.md fully.

Create tailwind.config.js using the exact HeroUI theme configuration defined
in the "HeroUI Theme — Leen Design System" section of CLAUDE.md.

Include:
- content paths for index.html, src/**/*.{js,ts,jsx,tsx}, and HeroUI theme dist
- heroui() plugin with the primary teal and secondary purple colors exactly as defined
- darkMode: "class"
```

---

### Step 1-D — index.html

```
Read CLAUDE.md fully.

Create index.html — the root HTML file for leen-booking.

Include:
- HTML5 boilerplate with lang="ar" dir="rtl" as default (Arabic first)
- Viewport meta: width=device-width, initial-scale=1, maximum-scale=5
- Theme color meta: #0E9B73
- Link rel="manifest" href="/leen-booking/manifest.json"
- Apple touch icon link
- Title: "ليـن | Leen — احجز جلستك"
- Root div id="root"
- Script type="module" src="/src/main.jsx"
- No inline styles — clean and minimal
```

---

### Step 1-E — public/manifest.json

```
Read CLAUDE.md fully.

Create public/manifest.json — PWA manifest for leen-booking.

Include:
- name: "ليـن للعلاج النفسي"
- short_name: "ليـن"
- description: "احجز جلستك مع معالجيك المعتمدين"
- start_url: "/leen-booking/"
- display: "standalone"
- background_color: "#FFFFFF"
- theme_color: "#0E9B73"
- orientation: "portrait"
- lang: "ar"
- icons array:
  { src: "/leen-booking/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" }
  { src: "/leen-booking/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
- screenshots: []
- categories: ["health", "medical"]
```

---

## ─────────────────────────────────────────
## STAGE 2 — Core App Files
## ─────────────────────────────────────────

### Step 2-A — src/api.js

```
Read CLAUDE.md fully.

Create src/api.js — all communication with the Google Apps Script backend.

Define at the top:
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";
const ORIGIN = window.location.origin;

Implement these async functions (all include origin parameter in every request):

getTherapists()
— GET request with action=getTherapists
— Returns array of active therapist objects from Therapists tab
— Each therapist: { id, nameEN, nameAR, titleEN, titleAR, bioEN, bioAR,
  specialties, sessionTypes, modes, languages, fees, workingDays,
  startTime, endTime, photoURL, displayOrder }

getAvailableSlots(therapistId, date)
— GET request with action=getAvailableSlots, therapistId, date (YYYY-MM-DD)
— Returns array of available time strings: ["09:00", "10:00", "11:00"...]
— Already excludes booked and blocked slots

submitBooking(bookingData)
— POST request with action=submitBooking
— bookingData: { therapistId, therapistName, clientName, clientPhone,
  clientEmail, sessionDate, sessionTime, sessionType, sessionMode, fee,
  revenueTherapist, revenueCenter, notes }
— Returns { success: true, bookingId: "B-2024-001" } or { success: false, error: "..." }

All functions:
— Use try/catch and return { success: false, error: message } on failure
— Pass origin: ORIGIN in every request body/params
— Use JSON.stringify for POST bodies
— Set Content-Type: application/json on POST requests
```

---

### Step 2-B — src/i18n.js

```
Read CLAUDE.md fully.

Create src/i18n.js — all bilingual strings and the useI18n hook.

Implement useI18n() hook exactly as defined in the "Bilingual Support" section of CLAUDE.md.

The translations object must cover all strings for all 8 screens:

navigation: bookSession, browseTherapists, back, home

home: heroTitle, heroSubtitle, ctaButton, aboutCenter, aboutText

therapists: pageTitle, filterAll, filterIndividual, filterCouples, filterFamily,
filterGroup, fromPrice, bookNow, inPerson, online, both, languages, yearsExp

profile: about, sessionDetails, sessionLength, fees, available, languages,
bookWith, individual, couples, family, minutes, perSession

slotPicker: pageTitle, selectDate, selectTime, sessionType, sessionMode,
noSlotsAvailable, continueBtn, inPerson, online, totalFee

bookingForm: pageTitle, bookingSummary, yourDetails, fullName, phone, email,
notes, nameRequired, phoneRequired, invalidPhone, submitBooking,
submitting, namePlaceholder, phonePlaceholder, emailPlaceholder, notesPlaceholder

confirmation: successTitle, successMessage, bookingRef, therapist, date, time,
type, mode, fee, confirmNote, callUs, bookAnother, addToCalendar

general: loading, error, retry, offline, offlineMessage, callCenter,
installPrompt, installBtn, dismiss, poweredBy

Arabic translations must be complete — not placeholders.
All center-specific text uses neutral phrasing suitable for a therapy center.
```

---

### Step 2-C — src/main.jsx

```
Read CLAUDE.md fully.

Create src/main.jsx — React entry point for leen-booking.

Include:
- Import React, ReactDOM
- Import HeroUIProvider from @heroui/react
- Import RouterProvider, createBrowserRouter from react-router-dom
- Import App from ./App.jsx
- Import ./index.css (Tailwind base styles)

Create the router with basename="/leen-booking/"

Render:
<HeroUIProvider>
  <RouterProvider router={router} />
</HeroUIProvider>

Apply initial language direction on mount:
Read localStorage 'leen_lang', default to 'ar'.
Set document.documentElement.lang and document.documentElement.dir accordingly.
```

---

### Step 2-D — src/App.jsx

```
Read CLAUDE.md fully.

Create src/App.jsx — route definitions for leen-booking.

Define routes:
/ → Home
/therapists → Therapists
/therapist/:id → TherapistProfile
/book/:therapistId → SlotPicker
/details → BookingForm
/confirmation → Confirmation

Add a catch-all route that redirects to /.

Also add a root layout component that:
- Wraps all routes
- Renders InstallPrompt component (shown only on second visit)
- Applies RTL/LTR direction based on language in localStorage on every route change
```

---

### Step 2-E — src/utils.js

```
Read CLAUDE.md fully.

Create src/utils.js — shared utility functions for leen-booking.

Implement:

formatCurrency(amount, lang)
— returns "1,500 EGP" in English or "١٬٥٠٠ ج.م" in Arabic
— always set numeric part to dir="ltr" in the calling component
— note: this function returns the string, the component handles the dir wrapper

formatDate(dateStr, lang)
— input: "2024-01-15"
— returns "15 Jan 2024" in English or "15 يناير 2024" in Arabic
— month names array for both languages included in this file

formatTime(timeStr)
— input: "10:00"
— returns "10:00 AM" in English or "10:00 صباحاً" in Arabic

downloadJSON(data, filename)
— JSON.stringify(data, null, 2)
— creates Blob, triggers browser download with given filename

isMobile()
— returns window.innerWidth < 768

getVisitCount()
— read localStorage 'leen_visits', increment by 1, save, return new value

generateCalendarLink(booking)
— generates a Google Calendar URL with booking details pre-filled
— returns the URL string
```

---

## ─────────────────────────────────────────
## STAGE 3 — Shared Components
## ─────────────────────────────────────────

### Step 3-A — src/components/LanguageToggle.jsx

```
Read CLAUDE.md fully.

Create src/components/LanguageToggle.jsx

A small toggle button that switches between Arabic and English.

Behavior:
- Uses useI18n() hook from i18n.js
- On toggle: switches lang, updates localStorage 'leen_lang',
  updates document.documentElement.dir and document.documentElement.lang
- Reloads the page after direction change (simplest approach for full RTL support)

Visual:
- HeroUI ButtonGroup with two small Button variants
- "EN" and "ع" labels
- Active language button has primary color fill
- Inactive is ghost/bordered
- Small size — fits in any header
```

---

### Step 3-B — src/components/LoadingSpinner.jsx

```
Read CLAUDE.md fully.

Create src/components/LoadingSpinner.jsx

A centered full-page loading state using HeroUI Spinner.

Props:
- message: string (optional) — shown below spinner
- fullPage: boolean (default true) — if true, centers in full viewport height

Use HeroUI Spinner component with primary color.
Show message below spinner in muted text using t('general.loading') as default.
```

---

### Step 3-C — src/components/TherapistCard.jsx

```
Read CLAUDE.md fully.

Create src/components/TherapistCard.jsx

A card displayed on the Therapists browse page. One card per therapist.

Props: therapist object (structure defined in api.js getTherapists() return)

Visual using HeroUI Card component:
- Top section: therapist photo (HeroUI Avatar, large, fallback to initials) + name + title
- Specialty tags: HeroUI Chip components, primary color, small size, max 3 shown + "+N more"
- Bottom row: mode badge (In-person / Online / Both — different colors), starting fee, "Book" Button
- Language badge: small chip showing languages spoken
- Card is fully clickable → navigates to /therapist/:id
- "Book" button → navigates to /book/:therapistId (stops propagation)

Both name and title shown in current language (nameEN/nameAR, titleEN/titleAR from therapist object).
Fee formatted as "from X EGP".
```

---

### Step 3-D — src/components/SlotGrid.jsx

```
Read CLAUDE.md fully.

Create src/components/SlotGrid.jsx

Displays a grid of available time slots for a selected date.

Props:
- slots: string[] — available time strings ["09:00", "10:00"...]
- selectedSlot: string — currently selected time
- onSelect: function — called with time string when slot clicked
- loading: boolean

Visual:
- Grid layout: 3 columns on mobile, 4 on desktop
- Each slot: HeroUI Button, bordered variant
- Selected slot: primary filled variant
- Loading: show 8 skeleton placeholder buttons (HeroUI Skeleton)
- Empty state: gentle message in current language "No slots available for this date"
- Slot text: format as "10:00 AM" or "10:00 صباحاً" based on language
```

---

## ─────────────────────────────────────────
## STAGE 4 — Home & Browse Screens
## ─────────────────────────────────────────

### Step 4-A — src/pages/Home.jsx

```
Read CLAUDE.md fully.

Create src/pages/Home.jsx — the landing screen of the client booking app.

Structure (mobile-first, single column):
- Top bar: Leen logo (text-based if no SVG yet) on left, LanguageToggle on right
- Hero section: large heading t('home.heroTitle'), subtitle t('home.heroSubtitle')
  Primary color accent on first word of heading
- CTA: large HeroUI Button, primary color, full width on mobile,
  text t('home.ctaButton'), navigates to /therapists
- About section: HeroUI Card with short center description t('home.aboutText')
  Include a small icon (HeroUI or emoji) to make it warm and approachable
- Footer: center phone number, very subtle

Design must feel calming and professional — appropriate for a therapy center.
Not clinical. Warm, trustworthy, clean.
No heavy animations. Subtle fade-in on mount using Framer Motion.
```

---

### Step 4-B — src/pages/Therapists.jsx

```
Read CLAUDE.md fully.

Create src/pages/Therapists.jsx — browse all active therapists with filters.

Structure:
- Top bar: back arrow → Home, title t('therapists.pageTitle'), LanguageToggle
- Filter pills row (HeroUI Tabs or ButtonGroup):
  All, Individual, Couples, Family, Group
  Filter state stored in local component state
  Filtering is client-side on the fetched therapist array
- Therapist list: map filtered therapists → TherapistCard component
  Staggered fade-in animation (Framer Motion, 50ms delay per card)
- Loading state: 3 skeleton cards using HeroUI Skeleton
- Error state: HeroUI Card with error message and retry button
- Empty filter state: gentle message if no therapists match the filter

On mount: call api.getTherapists(), store in state.
Filter logic: if selectedFilter === 'All', show all.
Otherwise show therapists whose sessionTypes array includes the filter value.
```

---

## ─────────────────────────────────────────
## STAGE 5 — Profile & Slot Picker
## ─────────────────────────────────────────

### Step 5-A — src/pages/TherapistProfile.jsx

```
Read CLAUDE.md fully.

Create src/pages/TherapistProfile.jsx — full therapist profile.

Get therapist from API using id from useParams(). Show LoadingSpinner while fetching.

Structure:
- Top bar: back arrow → /therapists, LanguageToggle
- Profile hero: large HeroUI Avatar (photo or initials), name (current lang), title (current lang)
- Specialty chips: HeroUI Chip row, primary bordered variant
- Mode + language badges: small colored chips
- Divider
- About section: label t('profile.about'), bio text (bioEN or bioAR based on lang)
- Session details: HeroUI Table or clean list rows:
  Session length | [duration] minutes
  Individual fee | [fee] EGP
  Couples fee | [fee] EGP (if offered)
  Family fee | [fee] EGP (if offered)
  Languages | [languages]
  Available days | [working days translated]
- Sticky bottom bar (mobile) or bottom section (desktop):
  Selected session type selector (HeroUI Select — only types this therapist offers)
  Mode selector if therapist offers both
  Fee display updates based on selection
  Large primary Button: t('profile.bookWith') + therapist first name
  → navigates to /book/:therapistId, passes { therapist, sessionType, sessionMode, fee } via router state
```

---

### Step 5-B — src/pages/SlotPicker.jsx

```
Read CLAUDE.md fully.

Create src/pages/SlotPicker.jsx — pick date and time slot.

Receives state from TherapistProfile: { therapist, sessionType, sessionMode, fee }
If state is missing (direct URL access), redirect to /therapists.

Structure:
- Top bar: back arrow, title t('slotPicker.pageTitle'), LanguageToggle
- Booking summary strip: therapist name, session type, mode, fee — non-editable summary
- Date picker section:
  Label: t('slotPicker.selectDate')
  Use a simple custom calendar component (NOT a library — build it with HeroUI Buttons)
  Show current month. Previous/next month navigation arrows.
  Only show days that match therapist's Working_Days and are within BOOKING_WINDOW_DAYS ahead.
  Booked and blocked days greyed out (fetched from available slots).
  Selected day highlighted in primary color.
- Time slots section (shown after date selected):
  Label: t('slotPicker.selectTime')
  Render SlotGrid component with slots from api.getAvailableSlots(therapistId, selectedDate)
  Loading spinner while fetching slots
- Continue button (disabled until both date and time selected):
  → navigates to /details, passes full booking state via router state
```

---

## ─────────────────────────────────────────
## STAGE 6 — Booking Form & Confirmation
## ─────────────────────────────────────────

### Step 6-A — src/pages/BookingForm.jsx

```
Read CLAUDE.md fully.

Create src/pages/BookingForm.jsx — client details form.

Receives state from SlotPicker: { therapist, sessionType, sessionMode, fee, date, time }
If state is missing, redirect to /therapists.

Structure:
- Top bar: back arrow, title t('bookingForm.pageTitle'), LanguageToggle
- Booking summary card (HeroUI Card, light background):
  Therapist name, date formatted, time formatted, session type, mode, fee
  Non-editable. Clear and prominent.
- Form section: title t('bookingForm.yourDetails')
  All fields use HeroUI Input component:
  1. Full name (required) — t('bookingForm.fullName'), show error if empty on submit
  2. Phone number (required) — t('bookingForm.phone'), tel input type, validate Egyptian format (starts with 01, 11 digits)
  3. Email (optional) — t('bookingForm.email'), email input type
  4. Notes for therapist (optional) — HeroUI Textarea, t('bookingForm.notes'), max 300 chars
- Submit button: HeroUI Button primary full-width, t('bookingForm.submitBooking')
  Show HeroUI Spinner inside button while submitting
  Disabled while submitting
- Error handling: if API returns error, show HeroUI Alert danger below form

On submit:
- Validate name and phone (show inline errors under fields)
- Call api.submitBooking(bookingData)
- On success: navigate to /confirmation with booking result + original state
- On error: show error message, keep form filled
```

---

### Step 6-B — src/pages/Confirmation.jsx

```
Read CLAUDE.md fully.

Create src/pages/Confirmation.jsx — booking submitted successfully.

Receives state: { bookingId, therapist, date, time, sessionType, sessionMode, fee, clientName, clientPhone }
If state is missing, redirect to /.

Structure:
- No back arrow (intentional — booking is done)
- LanguageToggle top right
- Success icon: large green checkmark (HeroUI or SVG)
- Heading: t('confirmation.successTitle')
- Message: t('confirmation.successMessage') — explains "we'll confirm within 24 hours"
- Booking reference card (HeroUI Card):
  Booking ID, therapist name, date, time, session type, mode, fee
- Contact note: "Questions? Call us: [CENTER_PHONE from Settings]"
  Read center phone from a CONST in api.js (fetched from Settings or hardcoded as fallback)
- Two action buttons:
  1. t('confirmation.addToCalendar') → opens Google Calendar link from utils.generateCalendarLink()
  2. t('confirmation.bookAnother') → navigates to /therapists

Subtle confetti or success animation using Framer Motion on mount (tasteful, not excessive).
```

---

## ─────────────────────────────────────────
## STAGE 7 — PWA, Apps Script & Deploy
## ─────────────────────────────────────────

### Step 7-A — src/components/InstallPrompt.jsx

```
Read CLAUDE.md fully.

Create src/components/InstallPrompt.jsx — PWA install banner.

Behavior:
- Only show on second visit or later (check utils.getVisitCount() >= 2)
- Do not show if user has dismissed it (check localStorage 'leen_install_dismissed')
- On Android: listen for beforeinstallprompt event, show custom banner with install button
- On iOS: show banner with manual instructions "Tap Share → Add to Home Screen"
- Detect iOS: /iPad|iPhone|iPod/.test(navigator.userAgent)

Visual (HeroUI Card, fixed bottom, above safe area):
- Leen icon (small), text: t('general.installPrompt')
- Install button (primary, small)
- Dismiss X button (ghost, small) → sets localStorage 'leen_install_dismissed' = true

Rendered in App.jsx layout so it appears on all pages.
```

---

### Step 7-B — public/sw.js (Service Worker)

```
Read CLAUDE.md fully.

Create public/sw.js — the service worker for leen-booking.

Note: vite-plugin-pwa generates the main service worker automatically.
This file is the custom offline fallback page handler.

Implement:
- Cache name: 'leen-booking-v1'
- On install: cache the offline fallback HTML
- On fetch: for navigation requests that fail, serve the offline fallback
- The offline fallback is a simple inline HTML string that shows:
  Center name, offline message in Arabic and English,
  center phone number (hardcoded as fallback), retry button that reloads

Keep this file minimal — vite-plugin-pwa handles the main caching strategy.
```

---

### Step 7-C — .github/workflows/deploy.yml

```
Read CLAUDE.md fully.

Create .github/workflows/deploy.yml for leen-booking.

Use the exact GitHub Actions workflow defined in the
"GitHub Actions — Auto Deploy" section of CLAUDE.md.

This workflow:
- Triggers on push to main
- Runs npm install and npm run build
- Deploys the /dist folder to GitHub Pages
```

---

### Step 7-D — Google Apps Script (paste into script.google.com)

```
Read CLAUDE.md fully.

Write the complete Google Apps Script code for the Leen backend.
This is NOT a file in the repo — it goes into the Apps Script editor at script.google.com.

Implement the full script with:

1. Constants at the top:
   SPREADSHEET_ID (empty string — script is bound to the sheet, use SpreadsheetApp.getActiveSpreadsheet())
   ALLOWED_ORIGIN = 'https://[github-username].github.io'
   ADMIN_EMAIL read from Settings tab

2. checkOrigin(e) function — validates request origin parameter

3. doGet(e) — routes to correct GET handler based on e.parameter.action:
   getTherapists, getAvailableSlots, getDashboardData (basic version returning empty for now),
   backup

4. doPost(e) — routes to correct POST handler based on parsed body action:
   submitBooking, confirmBooking, cancelBooking

5. getTherapists() — reads Therapists tab, filters Active=TRUE, returns JSON array

6. getAvailableSlots(therapistId, dateStr) —
   - Read therapist working days, start time, end time, session duration from Therapists tab
   - Check if the requested date falls on a working day
   - Generate all possible slots for that day
   - Check Bookings tab for already-confirmed/pending bookings on that date for that therapist
   - Check Availability tab for blocked exceptions on that date
   - Remove booked and blocked slots
   - Return remaining available slot strings

7. submitBooking(data) —
   - Write new row to Bookings tab with auto-generated Booking_ID
   - Check Clients tab for existing phone number — create new client row if not found
   - Send email to ADMIN_EMAIL with booking details using MailApp.sendEmail()
   - Return { success: true, bookingId }

8. confirmBooking(data) —
   - Update Status to "Confirmed" and Confirmed_At timestamp in Bookings tab
   - If client email exists, send confirmation email to client

9. cancelBooking(data) —
   - Update Status to "Cancelled" in Bookings tab
   - If client email exists, send cancellation email to client

10. cors() helper — returns ContentService output with JSON and proper headers

11. Daily reminder trigger function sendReminders() —
    - Finds all bookings for tomorrow with Reminder_Sent = FALSE
    - Sends reminder email to each client who has an email address
    - Sets Reminder_Sent = TRUE

Instruction: After writing this code, paste it into the Apps Script editor,
save it, then go to Deploy → New deployment → Web app →
Execute as: Me, Who has access: Anyone → Deploy → copy the URL →
paste it into src/api.js as APPS_SCRIPT_URL.
Also set up the daily trigger: Triggers → Add trigger → sendReminders → Time-driven → Day timer → 8am-9am Cairo time.
```

---

### Step 7-E — Final QA: leen-booking

```
Read CLAUDE.md fully.

Perform a full QA pass on leen-booking. Fix any issues found.

1. Language toggle:
   - EN/AR switches on every page
   - RTL layout flips correctly (text alignment, padding, icon positions)
   - All strings update — no hardcoded Arabic or English text anywhere
   - Numbers and fees stay LTR in RTL mode

2. Booking flow end-to-end:
   - Home → Therapists → Profile → SlotPicker → BookingForm → Confirmation
   - Back navigation works correctly on every step
   - Booking state passes correctly between all screens
   - If any screen is opened directly without state, it redirects correctly

3. API integration:
   - Therapists load correctly from Apps Script
   - Available slots load on date selection
   - Booking submits and returns confirmation
   - Error states show correctly if API fails

4. Mobile layout at 390px width:
   - All buttons are easily tappable (min 44px height)
   - No horizontal scroll
   - Forms are fully usable
   - Slot grid is readable

5. PWA:
   - manifest.json has correct paths and icons
   - Install prompt appears on second visit
   - App installs correctly on Android home screen
   - Offline screen shows when connection drops

6. RTL specific:
   - Therapy card layout mirrors correctly in Arabic
   - Calendar navigation arrows flip in Arabic
   - Slot grid aligns correctly in Arabic
```

---

## ═══════════════════════════════════════════
## REPO 2: leen-admin (Admin PWA)
## ═══════════════════════════════════════════

## ─────────────────────────────────────────
## STAGE 8 — Admin Foundation
## ─────────────────────────────────────────

### Step 8-A — package.json (admin)

```
Read CLAUDE.md fully.

Create package.json for the leen-admin React + Vite + HeroUI project.

Same dependencies as leen-booking PLUS these additional packages:
- recharts: ^2.12.0 (for financial charts)
- xlsx: ^0.18.5 (for Excel export via SheetJS)
- date-fns: ^3.6.0 (for date manipulation in reports)

Same devDependencies as leen-booking.

Name: leen-admin
```

---

### Step 8-B — vite.config.js (admin)

```
Read CLAUDE.md fully.

Create vite.config.js for leen-admin.

Same structure as leen-booking vite.config.js but with:
- base: '/leen-admin/'
- PWA workbox runtimeCaching for the Apps Script URL
```

---

### Step 8-C — tailwind.config.js (admin)

```
Read CLAUDE.md fully.

Create tailwind.config.js for leen-admin.

Identical to leen-booking tailwind.config.js — same HeroUI theme.
Both apps share the same visual identity.
```

---

### Step 8-D — index.html (admin)

```
Read CLAUDE.md fully.

Create index.html for leen-admin.

Same structure as leen-booking index.html but:
- lang="ar" dir="rtl" default
- Title: "ليـن — لوحة التحكم"
- manifest href: "/leen-admin/manifest.json"
- theme-color: #0E9B73
```

---

### Step 8-E — public/manifest.json (admin)

```
Read CLAUDE.md fully.

Create public/manifest.json for leen-admin.

- name: "ليـن — لوحة التحكم"
- short_name: "ليـن Admin"
- start_url: "/leen-admin/"
- display: "standalone"
- background_color: "#FFFFFF"
- theme_color: "#0E9B73"
- Same icon paths as leen-booking but pointing to /leen-admin/icons/
- orientation: "any" (admin works in landscape on tablet)
```

---

## ─────────────────────────────────────────
## STAGE 9 — Admin Core Files
## ─────────────────────────────────────────

### Step 9-A — src/api.js (admin)

```
Read CLAUDE.md fully.

Create src/api.js for leen-admin — all Apps Script communication.

Same APPS_SCRIPT_URL constant as leen-booking (same backend).
Same ORIGIN constant and origin parameter on all requests.

Implement all admin API functions:

getDashboardData(month, year)
— GET action=getDashboardData
— Returns: { totalRevenue, totalExpenses, netIncome, sessionCount,
  pendingCount, recentBookings[], monthlyChart[] }

getSessions(filters)
— GET action=getSessions, params: month, year, therapistId (optional), status (optional)
— Returns array of full booking objects

getTransactions(month, year)
— GET action=getTransactions
— Returns array of transaction objects + runningBalance

getExpenses(month, year)
— GET action=getExpenses
— Returns array of expense objects

getPayouts(month, year)
— GET action=getPayouts
— Returns array of { therapistId, therapistName, totalEarned, totalPaid, pending, sessions[] }

getClients()
— GET action=getClients
— Returns full client directory array

getTherapistsFull()
— GET action=getTherapistsFull
— Returns all therapist data including inactive, for admin management

backup()
— GET action=backup
— Returns { transactions[], expenses[], bookings[], payouts[], exportedAt }

confirmBooking(bookingId)
— POST action=confirmBooking
— Returns { success: true }

cancelBooking(bookingId, reason)
— POST action=cancelBooking

markPaid(bookingId, paymentMethod)
— POST action=markPaid

addTransaction(transactionData)
— POST action=addTransaction

addExpense(expenseData)
— POST action=addExpense

updateTherapist(therapistData)
— POST action=updateTherapist

blockDate(therapistId, date, timeStart, timeEnd, reason)
— POST action=blockDate

markPayoutPaid(therapistId, month, year, amount)
— POST action=markPayoutPaid

updatePassword(newHash)
— POST action=updatePassword
— Returns { success: true }

All functions include error handling as in leen-booking api.js.
```

---

### Step 9-B — src/auth.js

```
Read CLAUDE.md fully.

Create src/auth.js — authentication for the admin app.

Implement:

async hashPassword(password)
— Uses Web Crypto API: crypto.subtle.digest('SHA-256', encoded)
— Returns hex string
— Must match how the hash is stored in Settings tab

async login(username, password)
— Fetch current password hash from Settings tab via Apps Script
  (GET action=getSettings returns Settings tab key-value pairs)
— Hash the entered password using hashPassword()
— Compare with stored hash
— If match: store session token in sessionStorage key 'leen_admin_session'
  Token value: btoa(username + ':' + Date.now())
— Return { success: true } or { success: false, error: 'Invalid credentials' }

logout()
— sessionStorage.removeItem('leen_admin_session')
— window.location.href = '/leen-admin/'

isAuthenticated()
— return !!sessionStorage.getItem('leen_admin_session')

getAdminUsername()
— decode the stored token, return the username part
```

---

### Step 9-C — src/i18n.js (admin)

```
Read CLAUDE.md fully.

Create src/i18n.js for leen-admin — all bilingual strings and useI18n hook.

Same useI18n() hook structure as leen-booking i18n.js.
Same localStorage key 'leen_lang'.

Translations must cover all strings across all 10 admin pages:

nav: dashboard, sessions, cashflow, expenses, payouts, therapists,
clients, reports, settings, logout

dashboard: title, todaySessions, todayRevenue, pendingBookings,
recentActivity, monthlyRevenue, confirm, cancel, lastBackup, backupWarning,
noPending, noActivity

sessions: title, allSessions, filter, filterByTherapist, filterByStatus,
filterByDate, client, therapist, date, time, type, mode, fee, therapistShare,
centerShare, status, payment, actions, confirm, cancel, markPaid, export,
paymentMethod, cash, bankTransfer

cashflow: title, addTransaction, transactionLog, description, category,
cashIn, cashOut, balance, method, date, monthlyTotal, totalIn, totalOut, net, export

expenses: title, addExpense, expenseLog, category, item, expected, actual,
variance, paidBy, overBudget, onBudget, underBudget, monthlyView, export, chart

payouts: title, therapistName, totalEarned, totalPaid, pending, markPaid,
payoutHistory, sessions, month, settlePayout, alreadyPaid, export

therapistMgmt: title, editTherapist, name, title2, bio, specialties,
sessionTypes, modes, workingDays, startTime, endTime, duration, fees,
revenueShare, photoUrl, active, inactive, blockDate, blockReason, saveChanges

clients: title, search, name, phone, email, firstSession, lastSession,
totalSessions, preferredTherapist, status, notes, active, inactive, sessionHistory

reports: title, selectMonth, incomeStatement, revenue, expenses2, netIncome,
ytdChart, exportSessions, exportExpenses, exportPayouts, generating, downloadReady

settings: title, changePassword, currentPassword, newPassword, confirmPassword,
passwordMismatch, passwordChanged, centerInfo, backup, backupNow, lastBackup,
backupDownloaded, neverBacked, daysSinceBackup

general: loading, error, retry, save, cancel, delete, edit, add, confirm,
search, noResults, required, invalidEmail, success, close
```

---

## ─────────────────────────────────────────
## STAGE 10 — App Shell & Layout
## ─────────────────────────────────────────

### Step 10-A — src/components/AuthGuard.jsx

```
Read CLAUDE.md fully.

Create src/components/AuthGuard.jsx

A wrapper component that protects routes from unauthenticated access.

Behavior:
- On mount: call isAuthenticated() from auth.js
- If not authenticated: redirect to /login immediately
- If authenticated: render children
- While checking: show LoadingSpinner (should be instantaneous since it's sessionStorage)

Usage in App.jsx:
<AuthGuard><Dashboard /></AuthGuard>
```

---

### Step 10-B — src/components/Sidebar.jsx

```
Read CLAUDE.md fully.

Create src/components/Sidebar.jsx — desktop navigation (≥768px only).

Structure (HeroUI components):
- Fixed left sidebar, full height, width 220px
- Leen logo + center name at top
- Navigation items (use HeroUI listbox or custom nav):
  Each item: icon (heroicons or emoji) + label from t() + active state
  Items in order: Dashboard, Sessions, Cash Flow, Expenses, Payouts, Therapists, Clients, Reports, Settings
- Active item: primary color background, bold label
- Active detection: compare with current route path
- Bottom of sidebar: admin username display, logout button (HeroUI Button ghost danger)
- LanguageToggle at bottom
```

---

### Step 10-C — src/components/BottomNav.jsx

```
Read CLAUDE.md fully.

Create src/components/BottomNav.jsx — mobile navigation (<768px only).

Fixed bottom bar with 5 tabs (most important modules only — space is limited):
1. Dashboard (home icon)
2. Sessions (calendar icon)
3. Cash Flow (arrows icon)
4. Expenses (receipt icon)
5. More → opens a bottom sheet with: Payouts, Therapists, Clients, Reports, Settings, Logout

Each tab: icon + small label below using t()
Active tab: primary color icon and label
HeroUI components for the bottom sheet (Modal or Drawer)
Safe area padding for devices with home indicator (padding-bottom env(safe-area-inset-bottom))
```

---

### Step 10-D — src/components/TopBar.jsx

```
Read CLAUDE.md fully.

Create src/components/TopBar.jsx — mobile top bar (<768px only).

Props: title (string)

Structure:
- Fixed top bar, full width
- Left: Leen logo (small text or icon)
- Center: page title from props
- Right: LanguageToggle + notification bell icon (shows red dot if pending bookings > 0)

Notification count: read from a shared context or prop passed from AppShell.
```

---

### Step 10-E — src/components/AppShell.jsx

```
Read CLAUDE.md fully.

Create src/components/AppShell.jsx — wraps all protected admin pages.

This component handles the responsive layout split:
- Desktop (≥768px): renders Sidebar on left, main content area on right with padding
- Mobile (<768px): renders TopBar at top, main content area, BottomNav fixed at bottom

Props:
- children: ReactNode (the page content)
- title: string (page title for TopBar)
- pendingCount: number (for notification badge — fetched from dashboard data)

The AppShell also:
- Polls the Apps Script every 60 seconds for pendingBookings count
- Stores pending count in React state
- Passes pending count to TopBar

Usage in App.jsx:
<AuthGuard>
  <AppShell title={t('nav.dashboard')}>
    <Dashboard />
  </AppShell>
</AuthGuard>
```

---

### Step 10-F — src/main.jsx and src/App.jsx (admin)

```
Read CLAUDE.md fully.

Create src/main.jsx and src/App.jsx for leen-admin.

main.jsx:
- Same structure as leen-booking main.jsx
- HeroUIProvider + RouterProvider
- basename="/leen-admin/"
- Apply initial language direction from localStorage

App.jsx — define all routes:
/login → Login (no AuthGuard)
/ → redirect to /dashboard
/dashboard → AuthGuard → AppShell title=dashboard → Dashboard
/sessions → AuthGuard → AppShell title=sessions → Sessions
/cashflow → AuthGuard → AppShell title=cashflow → CashFlow
/expenses → AuthGuard → AppShell title=expenses → Expenses
/payouts → AuthGuard → AppShell title=payouts → Payouts
/therapists → AuthGuard → AppShell title=therapistMgmt → TherapistMgmt
/clients → AuthGuard → AppShell title=clients → Clients
/reports → AuthGuard → AppShell title=reports → Reports
/settings → AuthGuard → AppShell title=settings → Settings
* → redirect to /dashboard
```

---

## ─────────────────────────────────────────
## STAGE 11 — Login & Dashboard
## ─────────────────────────────────────────

### Step 11-A — src/pages/Login.jsx

```
Read CLAUDE.md fully.

Create src/pages/Login.jsx — admin login screen.

Structure:
- Centered card layout, full viewport height
- Leen logo + center name at top of card
- HeroUI Input: username (type text, required)
- HeroUI Input: password (type password, required, show/hide toggle)
- Login button (HeroUI Button primary full width)
  Shows Spinner while authenticating
- Error message (HeroUI Alert danger) below button if login fails
- LanguageToggle top right

On submit:
- Call auth.login(username, password)
- On success: navigate to /dashboard
- On failure: show error message t('general.invalidCredentials')

On mount: if isAuthenticated(), redirect to /dashboard immediately.
```

---

### Step 11-B — src/components/StatCard.jsx

```
Read CLAUDE.md fully.

Create src/components/StatCard.jsx — reusable stat display tile.

Props:
- icon: ReactNode
- value: string or number
- label: string
- color: 'primary' | 'success' | 'warning' | 'danger' | 'default'
- trend: { value: number, direction: 'up' | 'down' } (optional)

Visual (HeroUI Card):
- Colored icon background (soft tint based on color prop)
- Large value text (formatted number)
- Smaller label text
- Optional trend indicator (small up/down arrow + percentage)
- Clickable if onClick prop provided
```

---

### Step 11-C — src/components/RevenueChart.jsx

```
Read CLAUDE.md fully.

Create src/components/RevenueChart.jsx — monthly revenue line chart.

Props:
- data: array of { month: string, revenue: number, expenses: number }
- loading: boolean

Uses Recharts LineChart.
Two lines: revenue (primary teal) and expenses (danger red).
Responsive container — fills parent width.
Custom tooltip showing values in EGP formatted.
X-axis: month abbreviations. Y-axis: EGP values.
Loading state: HeroUI Skeleton replacing the chart area.
Legend at bottom: Revenue / Expenses labels using t() strings.
```

---

### Step 11-D — src/pages/Dashboard.jsx

```
Read CLAUDE.md fully.

Create src/pages/Dashboard.jsx — the admin home screen.

On mount: call api.getDashboardData(currentMonth, currentYear). Show LoadingSpinner.

Structure:
- Stat cards row (2 cols mobile, 4 cols desktop):
  Today's Sessions (calendar icon, default color)
  Today's Revenue (currency icon, success color)
  This Month Revenue (chart icon, primary color)
  Pending Confirmations (bell icon, warning color — shows count with red badge if > 0)

- Pending bookings section (only shown if pendingCount > 0):
  Title: t('dashboard.pendingBookings')
  List of pending booking cards, each showing:
  Client name, therapist, date, time, session type, mode, fee
  Two buttons per card: Confirm (primary) and Cancel (danger ghost)
  On confirm: call api.confirmBooking(id), remove from list, show success toast
  On cancel: show ConfirmModal, then call api.cancelBooking(id), remove from list

- Monthly revenue chart: RevenueChart component with last 6 months data

- Recent activity list (last 5 actions):
  Each row: icon, description, time ago, status badge

- Backup reminder: HeroUI Alert warning if last backup > 7 days ago
  Text: t('dashboard.backupWarning') + link to /settings
```

---

## ─────────────────────────────────────────
## STAGE 12 — Sessions Module
## ─────────────────────────────────────────

### Step 12-A — src/components/DataTable.jsx

```
Read CLAUDE.md fully.

Create src/components/DataTable.jsx — reusable sortable table for admin app.

Props:
- columns: array of { key, label, sortable?, render? }
  render is an optional function(row) → ReactNode for custom cell rendering
- data: array of row objects
- loading: boolean
- emptyMessage: string
- onRowClick: function (optional)

Features:
- HeroUI Table component as base
- Column header click toggles sort asc/desc if sortable: true
- Sort state managed internally
- Loading state: skeleton rows (5 rows, each column shows HeroUI Skeleton)
- Empty state: centered message with icon
- Responsive: on mobile (<768px), shows a card list instead of table
  Card list: each row becomes a HeroUI Card showing key fields
  The columns prop drives which fields appear in the card (first 4 columns)
- Pagination: if data.length > 20, show HeroUI Pagination at bottom
```

---

### Step 12-B — src/pages/Sessions.jsx

```
Read CLAUDE.md fully.

Create src/pages/Sessions.jsx — full session/booking management.

Filters (stored in component state):
- Month/year picker (HeroUI Select)
- Therapist filter (HeroUI Select populated from therapist list)
- Status filter: All, Pending, Confirmed, Completed, Cancelled, No-show
- Payment filter: All, Unpaid, Paid

On mount and filter change: call api.getSessions(filters). Show LoadingSpinner.

DataTable columns:
Client | Therapist | Date | Time | Type | Mode | Fee | Therapist Share | Center Share | Status | Payment | Actions

Actions column renders per row:
- If status is Pending: Confirm button (primary xs) + Cancel button (danger ghost xs)
- If status is Confirmed: Mark Paid button (success xs, only if Unpaid) + Mark Completed button + Cancel button
- If payment is Unpaid and status is Confirmed: payment method select + Mark Paid button

On Confirm: api.confirmBooking(id) → refresh table → success toast
On Cancel: ConfirmModal → api.cancelBooking(id) → refresh
On Mark Paid: HeroUI Popover with payment method select → api.markPaid(id, method) → refresh

Summary strip above table:
Total sessions shown, total revenue, total therapist payouts, total center revenue
All formatted as EGP values.

Export button: calls buildSessionsExcel(data) using SheetJS, downloads .xlsx file.
Filename: "Leen-Sessions-[Month]-[Year].xlsx"
```

---

## ─────────────────────────────────────────
## STAGE 13 — Cash Flow Module
## ─────────────────────────────────────────

### Step 13-A — src/pages/CashFlow.jsx

```
Read CLAUDE.md fully.

Create src/pages/CashFlow.jsx — cash in / cash out transaction log.

Replaces the "Bank" Excel sheet.

Month/year filter at top. On change: api.getTransactions(month, year).

Summary strip: Total Cash In (green) | Total Cash Out (red) | Net Balance (primary)
All EGP formatted.

Add Transaction panel (HeroUI Modal or inline collapsible):
Fields: Date (date input), Description (text), Category (HeroUI Select — values from CLAUDE.md),
Sub-category (text), Cash In amount (number, leave 0 if outgoing),
Cash Out amount (number, leave 0 if incoming), Method (Cash / Bank transfer), Notes (text).
On save: api.addTransaction(data) → refresh table → success toast.
Validate: either Cash_In or Cash_Out must be > 0, not both.

DataTable columns:
Date | Description | Category | Cash In | Cash Out | Balance | Method | Notes

Cash In cells: green text.
Cash Out cells: red text.
Balance column: always shows running total from API.

Export button: downloads "Leen-Transactions-[Month]-[Year].xlsx"
```

---

## ─────────────────────────────────────────
## STAGE 14 — Expense Tracker
## ─────────────────────────────────────────

### Step 14-A — src/components/ExpenseChart.jsx

```
Read CLAUDE.md fully.

Create src/components/ExpenseChart.jsx — expense category breakdown bar chart.

Props:
- data: array of { category: string, expected: number, actual: number }
- loading: boolean

Uses Recharts BarChart with two bars per category (expected vs actual).
Expected bar: primary teal (light). Actual bar: primary teal (dark).
Over-budget bars (actual > expected): danger red color.
Responsive container. Custom tooltip. Category labels on X-axis.
Loading: HeroUI Skeleton.
```

---

### Step 14-B — src/pages/Expenses.jsx

```
Read CLAUDE.md fully.

Create src/pages/Expenses.jsx — expense tracking.

Replaces the "Administrative Expenses" Excel sheet.

Month/year filter. On change: api.getExpenses(month, year).

Summary strip: Total Expected | Total Actual | Variance (green if under, red if over)

ExpenseChart component above the table — shows category breakdown.

Add Expense panel (HeroUI Modal):
Fields: Date, Category (Select — Cleaning / Coffee & Break / Facilities / Marketing / Salary / Initial Cost / Other),
Item description (text), Expected EGP (number), Actual EGP (number), Paid By (Cash / Bank transfer), Notes.
On save: api.addExpense(data) → refresh.

DataTable columns:
Date | Category | Item | Expected | Actual | Variance | Paid By | Notes

Variance column:
- Positive (over budget): red text + ▲ icon
- Negative (under budget): green text + ▼ icon
- Zero: neutral

Export button: "Leen-Expenses-[Month]-[Year].xlsx"
```

---

## ─────────────────────────────────────────
## STAGE 15 — Payouts Module
## ─────────────────────────────────────────

### Step 15-A — src/pages/Payouts.jsx

```
Read CLAUDE.md fully.

Create src/pages/Payouts.jsx — therapist revenue share tracking.

Month/year filter. On change: api.getPayouts(month, year).

One HeroUI Card per therapist showing:
- Therapist name + avatar (initials)
- Total earned this month (from their sessions × share %)
- Total already paid out (marked settled)
- Pending amount (earned − paid) — highlighted in warning color if > 0
- "Mark as Settled" button: opens ConfirmModal showing the pending amount,
  on confirm: api.markPayoutPaid(therapistId, month, year, pendingAmount) → refresh
- Expandable sessions breakdown: list of their sessions this month with dates, types, fees, their share per session

Summary at top: total center revenue this month (sum of center shares across all therapists).

Export payout report button: downloads "Leen-Payouts-[Month]-[Year].xlsx"
with one sheet per therapist showing their session breakdown.
```

---

## ─────────────────────────────────────────
## STAGE 16 — Therapist Management
## ─────────────────────────────────────────

### Step 16-A — src/pages/TherapistMgmt.jsx

```
Read CLAUDE.md fully.

Create src/pages/TherapistMgmt.jsx — manage therapist profiles.

On mount: api.getTherapistsFull() → list all therapists including inactive.

Therapist list: one HeroUI Card per therapist.
Card shows: photo/avatar, name (EN + AR), title, active/inactive badge, "Edit" button.

Click "Edit" → opens HeroUI Modal with full edit form:

Form sections:
1. Identity: Name EN, Name AR, Title EN, Title AR, Photo URL (text)
2. Bio: Bio EN (Textarea), Bio AR (Textarea)
3. Specialties: comma-separated text input with helper text
4. Session config:
   - Session Types: multi-select checkboxes (Individual, Couples, Family, Group, Workshop)
   - Modes: radio (In-person / Online / Both)
   - Languages: text input
5. Schedule:
   - Working Days: checkboxes (Sun Mon Tue Wed Thu Fri Sat)
   - Start Time: time input
   - End Time: time input
   - Session Duration: number input (minutes)
6. Fees: Fee Individual, Fee Couples, Fee Family (number inputs, EGP)
7. Financial: Revenue Share % (number input 0-100)
8. Status: Active toggle (HeroUI Switch)

On save: api.updateTherapist(data) → refresh list → success toast.

Separate "Block Date" section at bottom of edit modal:
Date picker + optional time range + reason text → api.blockDate() → success toast.
```

---

## ─────────────────────────────────────────
## STAGE 17 — Client Directory
## ─────────────────────────────────────────

### Step 17-A — src/pages/Clients.jsx

```
Read CLAUDE.md fully.

Create src/pages/Clients.jsx — client directory.

On mount: api.getClients(). Show LoadingSpinner.

Search bar at top: filters client list client-side by name or phone number as user types.
HeroUI Input with search icon, debounced 300ms.

DataTable columns:
Name | Phone | Email | First Session | Last Session | Total Sessions | Status | Notes

Click row → expands inline (or opens HeroUI Modal) with:
- Full client details
- Session history: DataTable of their bookings (date, therapist, type, mode, fee, status)
- Preferred therapist (read-only, set automatically from most-booked therapist)
- Admin notes: Textarea — editable, save button updates the row
- Status toggle: Active / Inactive

No delete button — clients are never deleted, only set to Inactive.
```

---

## ─────────────────────────────────────────
## STAGE 18 — Reports & Export
## ─────────────────────────────────────────

### Step 18-A — src/utils/excel.js

```
Read CLAUDE.md fully.

Create src/utils/excel.js — all Excel export functions using SheetJS (xlsx).

Implement:

exportSessionsExcel(sessions, month, year)
— Creates workbook with one sheet "Sessions"
— Columns: Booking ID, Date, Time, Client, Phone, Therapist, Type, Mode, Fee, Therapist Share, Center Share, Status, Payment
— Header row bold, frozen first row
— Filename: "Leen-Sessions-[Month]-[Year].xlsx"
— Triggers browser download

exportExpensesExcel(expenses, month, year)
— Sheet "Expenses"
— Columns: Date, Category, Item, Expected EGP, Actual EGP, Variance, Paid By, Notes
— Totals row at bottom (sum of Expected, Actual, Variance columns)
— Filename: "Leen-Expenses-[Month]-[Year].xlsx"

exportPayoutsExcel(payouts, month, year)
— One sheet per therapist named with their name
— Each sheet: their sessions breakdown (date, client, type, fee, their share)
— Totals row at bottom
— Summary sheet: therapist name | total earned | paid | pending
— Filename: "Leen-Payouts-[Month]-[Year].xlsx"

exportTransactionsExcel(transactions, month, year)
— Sheet "Transactions"
— All columns from Transactions tab
— Running balance column
— Totals: Total In, Total Out, Net
— Filename: "Leen-Transactions-[Month]-[Year].xlsx"
```

---

### Step 18-B — src/pages/Reports.jsx

```
Read CLAUDE.md fully.

Create src/pages/Reports.jsx — monthly and yearly reports.

Month/year selector at top.
On change: fetch getDashboardData + getSessions + getExpenses for selected period.

Income Statement card (HeroUI Card):
Clean table layout — no DataTable component here, manual layout:
  Total Revenue: [amount] EGP
  Total Expenses: [amount] EGP
  ────────────────────────────
  Net Income: [amount] EGP (green if positive, red if negative)
Revenue breakdown: session revenue by therapist (nested rows)
Expense breakdown: by category (nested rows)

Year-to-date chart:
RevenueChart showing all 12 months (current year to date)
Fetches monthly data for each completed month.
Shows projected line (dashed) if current year not complete.

Export buttons row:
- Export Sessions to Excel → exportSessionsExcel()
- Export Expenses to Excel → exportExpensesExcel()
- Export Payouts to Excel → exportPayoutsExcel()
- Export Transactions to Excel → exportTransactionsExcel()

Each button shows a spinner while generating and downloading.
```

---

## ─────────────────────────────────────────
## STAGE 19 — Settings & Backup
## ─────────────────────────────────────────

### Step 19-A — src/components/BackupButton.jsx

```
Read CLAUDE.md fully.

Create src/components/BackupButton.jsx — JSON data backup.

A HeroUI Button that triggers a full financial backup.

On click:
1. Show loading spinner inside button, disable button
2. Call api.backup()
3. On success: call utils.downloadJSON(data, 'leen-backup-' + today + '.json')
4. Call api.updateSettings({ LAST_BACKUP_DATE: today }) to update Settings tab
5. Show success toast: "Backup downloaded: leen-backup-[date].json"
6. Update the "last backup" display in Settings page

On error: show error toast, re-enable button.

The downloaded JSON structure:
{
  exportedAt: ISO timestamp,
  center: "Leen Psychotherapy Center",
  transactions: [...],
  expenses: [...],
  bookings: [...],
  payouts: [...]
}
```

---

### Step 19-B — src/pages/Settings.jsx

```
Read CLAUDE.md fully.

Create src/pages/Settings.jsx — admin settings page.

Three sections:

1. Change Password (HeroUI Card):
   - Current password (HeroUI Input password type)
   - New password (HeroUI Input password type)
   - Confirm new password (HeroUI Input password type)
   - Save Password button
   On save:
   - Validate new password === confirm password (show error if not)
   - Call auth.hashPassword(currentPassword) and verify against stored hash
   - Call auth.hashPassword(newPassword)
   - Call api.updatePassword(newHash)
   - Show success toast: t('settings.passwordChanged')

2. Data Backup (HeroUI Card):
   - Title: t('settings.backup')
   - Last backup date display — fetched from Settings tab LAST_BACKUP_DATE
   - If never backed up or > 7 days: HeroUI Alert warning
   - BackupButton component
   - Note explaining what is included in the backup

3. Center Information (HeroUI Card, read-only):
   - Center name, admin email (from Settings tab)
   - Note: "To change center info, edit the Settings tab in Google Sheets directly"

LanguageToggle prominent at top of page.
```

---

## ─────────────────────────────────────────
## STAGE 20 — PWA, Deploy & Final QA
## ─────────────────────────────────────────

### Step 20-A — public/sw.js (admin)

```
Read CLAUDE.md fully.

Create public/sw.js for leen-admin.

Same structure as leen-booking sw.js but with:
- Cache name: 'leen-admin-v1'
- Offline fallback page shows admin-specific message
- Note: admin app requires connection for all data — offline mode just shows
  "No connection — reconnect to access the admin panel" message
  and the center phone number
```

---

### Step 20-B — .github/workflows/deploy.yml (admin)

```
Read CLAUDE.md fully.

Create .github/workflows/deploy.yml for leen-admin.

Identical to leen-booking deploy.yml — same GitHub Actions workflow.
Builds and deploys /dist to GitHub Pages on every push to main.
```

---

### Step 20-C — Google Apps Script — Full Admin Endpoints

```
Read CLAUDE.md fully.

Extend the Google Apps Script (already written in Step 7-D) to add all admin endpoints.

Add to doGet() handler:
getDashboardData(month, year) —
  Read Bookings tab: count sessions for the month, sum revenue, count pending
  Read Transactions tab: sum cash in/out for the month
  Read last 5 bookings as recentActivity
  Build monthlyChart array: last 6 months revenue and expenses totals
  Return full dashboard object

getSessions(month, year, therapistId, status) —
  Read Bookings tab, filter by month/year (and optionally therapistId/status)
  Return array of booking objects

getTransactions(month, year) —
  Read Transactions tab, filter by month/year
  Return array with running balance calculation

getExpenses(month, year) —
  Read Expenses tab, filter by Month column value "YYYY-MM"
  Return array

getPayouts(month, year) —
  For each active therapist: sum their Revenue_Therapist from Bookings that month
  Return per-therapist payout objects

getClients() — read full Clients tab, return array

getTherapistsFull() — read full Therapists tab including inactive rows

getSettings() — return Settings tab as key-value object (exclude ADMIN_PASSWORD_HASH from response)

backup() — read Transactions, Expenses, Bookings (completed only), and therapist payout history
  Return combined JSON object

Add to doPost() handler:
addTransaction(data) — append row to Transactions tab, auto-update running Balance formula
addExpense(data) — append row to Expenses tab, auto-populate Month column
markPaid(bookingId, method) — update Payment_Status and Payment_Method columns
updateTherapist(data) — find row by Therapist_ID, update all columns
blockDate(data) — append row to Availability tab
markPayoutPaid(therapistId, month, year, amount) — append row to a Payouts history tab (create if not exists)
updatePassword(newHash) — update ADMIN_PASSWORD_HASH value in Settings tab
updateSettings(keyValues) — update one or more key-value rows in Settings tab
```

---

### Step 20-D — Final QA: leen-admin

```
Read CLAUDE.md fully.

Perform full QA on leen-admin. Fix all issues found.

1. Authentication:
   - Login works with correct credentials
   - Login shows error with wrong credentials
   - All protected routes redirect to /login if not authenticated
   - Session persists across page refreshes (sessionStorage)
   - Logout clears session and redirects to login

2. Language toggle:
   - EN/AR works on every page
   - RTL flips sidebar from left to right in Arabic
   - BottomNav labels flip correctly
   - All strings update — no hardcoded text
   - Numbers stay LTR in RTL mode

3. Responsive layout:
   - At 1200px: Sidebar + full multi-column layout
   - At 768px: Sidebar still visible or transitions to BottomNav
   - At 390px: BottomNav + TopBar + single column everything
   - Tables show as cards on mobile
   - No horizontal scroll on any page at 390px

4. All 8 modules:
   - Dashboard: stats load, pending cards show with Confirm/Cancel working
   - Sessions: table loads, filters work, confirm/cancel/mark-paid all work
   - CashFlow: table loads, add transaction works, export works
   - Expenses: table loads, chart shows, add expense works, export works
   - Payouts: cards load per therapist, mark settled works, export works
   - Therapists: list loads, edit modal opens, save works, block date works
   - Clients: list loads, search works, session history expands, notes save
   - Reports: income statement generates, charts show, all 4 exports work

5. Settings:
   - Password change works (validates correctly)
   - Backup downloads valid JSON file
   - Last backup date updates after backup

6. PWA:
   - manifest.json valid
   - Installs on Android and iOS
   - Works in standalone mode (no browser chrome)

7. Apps Script sync:
   - All GET requests return correct data
   - All POST requests update the sheet correctly
   - Email notifications send on booking submit/confirm/cancel
   - Daily reminder trigger is set up in Apps Script
```

---

## Build Summary

| Stage | Steps | Repo | Description |
|-------|-------|------|-------------|
| 1 | 5 steps | leen-booking | Foundation & Configuration |
| 2 | 5 steps | leen-booking | Core App Files |
| 3 | 4 steps | leen-booking | Shared Components |
| 4 | 2 steps | leen-booking | Home & Browse Screens |
| 5 | 2 steps | leen-booking | Profile & Slot Picker |
| 6 | 2 steps | leen-booking | Booking Form & Confirmation |
| 7 | 5 steps | leen-booking | PWA + Apps Script + Deploy |
| 8 | 5 steps | leen-admin | Admin Foundation |
| 9 | 3 steps | leen-admin | Admin Core Files |
| 10 | 6 steps | leen-admin | App Shell & Layout |
| 11 | 4 steps | leen-admin | Login & Dashboard |
| 12 | 2 steps | leen-admin | Sessions Module |
| 13 | 1 step  | leen-admin | Cash Flow Module |
| 14 | 2 steps | leen-admin | Expense Tracker |
| 15 | 1 step  | leen-admin | Payouts Module |
| 16 | 1 step  | leen-admin | Therapist Management |
| 17 | 1 step  | leen-admin | Client Directory |
| 18 | 2 steps | leen-admin | Reports & Export |
| 19 | 2 steps | leen-admin | Settings & Backup |
| 20 | 4 steps | leen-admin | PWA + Apps Script + Deploy + QA |

**Total: 60 focused prompts. Each = 1 file. Build leen-booking first (Stages 1–7), then leen-admin (Stages 8–20).**

---

## Tips

- Start every Claude Code session with: "Read CLAUDE.md fully. We are working on [repo name]. Continue from Step [X]."
- Run `npm run dev` at the start of each session to keep a local preview open.
- Test in browser after every stage — not just at the end.
- If a step produces an error: describe it to Claude Code and reference the step (e.g. "Fix Step 12-B, the Sessions table confirm button isn't calling the API").
- The Apps Script (Step 7-D and 20-C) is the most complex — if something doesn't work, add Logger.log() statements and check Executions in the Apps Script editor.
- Keep the Google Sheet open in a browser tab while testing — you can see data being written in real time.
- After completing each stage, push to GitHub to keep your work backed up.
- Update CLAUDE.md "Current State" section after each completed stage.
