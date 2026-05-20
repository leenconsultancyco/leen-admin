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
| leen-booking    | Client PWA      | GitHub Pages (public repo)     | React 19 + Vite + HeroUI|
| leen-admin      | Admin PWA       | GitHub Pages (public repo)     | React 19 + Vite + HeroUI|
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

- **Framework:** React 19 + Vite (React 19 required by HeroUI v3)
- **UI Library:** HeroUI v3 (@heroui/react)
- **Styling:** Tailwind CSS v4
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

## HeroUI v3 Component Cheat Sheet — ALWAYS USE THIS

This section exists because Claude Code defaults to v2 syntax from training data.
ALWAYS use the patterns below. Never use v2 patterns. Check each component here before writing it.

### The most important rule
HeroUI v3 uses **compound components**. Sub-components use dot notation: `<Card.Header>` not `<CardHeader>`.
There is NO `HeroUIProvider`. There is NO `useDisclosure`. There is NO `ModalContent`.

---

### Simple components (no compound structure)

```jsx
// Button
import { Button, Spinner } from '@heroui/react';
<Button variant="primary" size="lg" isDisabled={loading} onPress={handleClick}>
  {loading ? <Spinner size="sm" /> : 'Submit'}
</Button>
// variants: primary | secondary | outline | ghost | danger | danger-soft
// sizes: sm | md | lg

// Chip
import { Chip } from '@heroui/react';
<Chip color="success" size="md">Connected</Chip>
// colors: primary | secondary | success | warning | danger | default
// v2 used 'type' prop — v3 uses 'color'

// Spinner
import { Spinner } from '@heroui/react';
<Spinner size="sm" />   // sizes: sm | md | lg

// Skeleton
import { Skeleton } from '@heroui/react';
<Skeleton className="h-4 w-full rounded" />

// Input (single line)
import { Input, Label } from '@heroui/react';
<Input type="text" placeholder="Enter name" />
// Always pair with Label for accessibility

// TextArea
import { TextArea, Label } from '@heroui/react';
<TextArea placeholder="Enter notes" rows={4} />

// Checkbox
import { Checkbox, Label } from '@heroui/react';
<Checkbox id="terms"><Label>Accept terms</Label></Checkbox>

// Link
import { Link } from '@heroui/react';
<Link href="/path">Click here</Link>

// Alert
import { Alert } from '@heroui/react';
<Alert variant="danger">Error message here</Alert>
// variants: default | primary | success | warning | danger
```

---

### Compound components — dot notation required

```jsx
// Card
import { Card } from '@heroui/react';
<Card>
  <Card.Header>Title here</Card.Header>
  <Card.Content>Body content here</Card.Content>
  <Card.Footer>Footer here</Card.Footer>
</Card>
// v2 used: <CardHeader> <CardBody> <CardFooter> — WRONG in v3

// Avatar
import { Avatar } from '@heroui/react';
<Avatar>
  <Avatar.Image src="/photo.jpg" alt="User name" />
  <Avatar.Fallback>AB</Avatar.Fallback>  {/* shown when image fails */}
</Avatar>

// Tabs
import { Tabs } from '@heroui/react';
<Tabs defaultSelectedKey="tab1">
  <Tabs.ListContainer>
    <Tabs.List>
      <Tabs.Tab id="tab1">Tab One<Tabs.Indicator /></Tabs.Tab>
      <Tabs.Tab id="tab2">Tab Two<Tabs.Indicator /></Tabs.Tab>
    </Tabs.List>
  </Tabs.ListContainer>
  <Tabs.Panel id="tab1">Content for tab one</Tabs.Panel>
  <Tabs.Panel id="tab2">Content for tab two</Tabs.Panel>
</Tabs>

// Modal — BIGGEST CHANGE from v2
// v2 had: useDisclosure, ModalContent, ModalHeader, ModalBody, ModalFooter — ALL GONE
// v3 uses: Modal.Trigger (no state needed) OR isOpen/onOpenChange on Modal.Backdrop
import { Button, Modal } from '@heroui/react';

// Option A — Trigger pattern (no state needed, simplest):
<Modal>
  <Modal.Trigger>
    <Button>Open Modal</Button>
  </Modal.Trigger>
  <Modal.Backdrop>
    <Modal.Container>
      <Modal.Dialog>
        <Modal.Header>Modal Title</Modal.Header>
        <Modal.Body>Modal content here</Modal.Body>
        <Modal.Footer>
          <Button>Close</Button>
        </Modal.Footer>
      </Modal.Dialog>
    </Modal.Container>
  </Modal.Backdrop>
</Modal>

// Option B — Controlled pattern (when you need to open/close from code):
import { useOverlayState } from '@heroui/react';  // replaces useDisclosure
const state = useOverlayState();
<Button onPress={state.open}>Open</Button>
<Modal.Backdrop isOpen={state.isOpen} onOpenChange={state.toggle}>
  <Modal.Container>
    <Modal.Dialog>
      <Modal.Header>Title</Modal.Header>
      <Modal.Body>Content</Modal.Body>
      <Modal.Footer>
        <Button onPress={state.close}>Close</Button>
      </Modal.Footer>
    </Modal.Dialog>
  </Modal.Container>
</Modal.Backdrop>

// Select
import { Label, ListBox, Select } from '@heroui/react';
<Select placeholder="Choose one">
  <Label>Select label</Label>
  <ListBox>
    <ListBox.Item id="a">Option A</ListBox.Item>
    <ListBox.Item id="b">Option B</ListBox.Item>
  </ListBox>
</Select>
// v2 used: <SelectItem> — WRONG in v3, use <ListBox.Item>

// RadioGroup
import { Description, Label, Radio, RadioGroup } from '@heroui/react';
<RadioGroup name="plan" defaultValue="monthly">
  <Label>Billing period</Label>
  <Radio value="monthly"><Label>Monthly</Label></Radio>
  <Radio value="yearly"><Label>Yearly</Label></Radio>
</RadioGroup>

// Switch
import { Label, Switch } from '@heroui/react';
<Switch defaultSelected>
  <Label>Enable notifications</Label>
</Switch>

// Tooltip
import { Button, Tooltip } from '@heroui/react';
<Tooltip>
  <Tooltip.Trigger>
    <Button>Hover me</Button>
  </Tooltip.Trigger>
  <Tooltip.Content>Tooltip text here</Tooltip.Content>
</Tooltip>

// Popover
import { Button, Popover } from '@heroui/react';
<Popover>
  <Popover.Trigger>
    <Button>Open Popover</Button>
  </Popover.Trigger>
  <Popover.Content>
    <div className="p-4">Popover content here</div>
  </Popover.Content>
</Popover>

// Drawer (new in v3 — use instead of full-page overlays on mobile)
import { Button, Drawer } from '@heroui/react';
<Drawer>
  <Drawer.Trigger>
    <Button>Open Drawer</Button>
  </Drawer.Trigger>
  <Drawer.Backdrop>
    <Drawer.Container>
      <Drawer.Content>
        <Drawer.Header>Title</Drawer.Header>
        <Drawer.Body>Content here</Drawer.Body>
        <Drawer.Footer>
          <Button>Close</Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer.Container>
  </Drawer.Backdrop>
</Drawer>
```

---

### Table
```jsx
import { Table } from '@heroui/react';
// Table in v3 uses standard HTML-like structure — verify at heroui.com/docs/components/table
// If Table compound API is uncertain, use a plain HTML <table> with Tailwind classes instead
// Never guess the Table API — check the docs or use plain HTML
```

---

### What does NOT exist in v3 — never import these:
```
ModalContent      → use Modal.Dialog
ModalHeader       → use Modal.Header
ModalBody         → use Modal.Body
ModalFooter       → use Modal.Footer
useDisclosure     → use Modal.Trigger (no state) or useOverlayState (controlled)
HeroUIProvider    → use I18nProvider for locale only
CardHeader        → use Card.Header
CardBody          → use Card.Content
CardFooter        → use Card.Footer
SelectItem        → use ListBox.Item
```

---

### Import pattern — always named imports from @heroui/react:
```jsx
import { Button, Card, Modal, Avatar, Tabs, Select, ListBox, Chip, Spinner } from '@heroui/react';
```


---

## HeroUI Theme — Leen Design System

Configured in tailwind.config.js in both repos.
Primary color: calm teal green. Secondary: soft purple.

```js
// HeroUI v3 uses Tailwind CSS v4 — CSS-first configuration (no tailwind.config.js plugins array)
// Instead, configure in your main CSS file (index.css):
// @import "tailwindcss";
// @import "@heroui/styles";
// Then use CSS variables for theming:

// For custom primary color in index.css:
// :root {
//   --color-primary: oklch(0.62 0.15 162);   /* teal */
// }

// The theme system in v3 uses CSS variables directly, not heroui() plugin.
// See CLAUDE.md Theme System section for the 6-theme CSS variable definitions.

// tailwind.config.js (minimal — v4 is CSS-first):
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
};

// Legacy reference (v2 syntax — DO NOT USE with v3):
// import { heroui } from "@heroui/react";
// plugins: [ heroui({ themes: { light: { colors: { primary: {
```


---

## Theme System — 6 Color Palettes

Both apps support theme switching. Selected theme stored in localStorage key `leen_theme`.
Default theme: **teal**. Applied via `data-theme` attribute on `<html>` element.
Theme switcher appears in: **Settings page (admin)** and **Home screen (booking)**.

### All 6 themes defined in tailwind.config.js:

```js
heroui({
  themes: {
    teal: {         // DEFAULT
      colors: { primary: { DEFAULT: "#0E9B73", foreground: "#FFFFFF",
        50:"#E8F7F2", 100:"#C5EBE0", 200:"#8ED6C0", 300:"#57C1A0",
        400:"#2DAE88", 500:"#0E9B73", 600:"#0B7D5D", 700:"#085F47",
        800:"#054030", 900:"#022018" }}
    },
    navy: {
      colors: { primary: { DEFAULT: "#1B2A6B", foreground: "#FFFFFF",
        50:"#E8EAF6", 100:"#C5CBE9", 200:"#9FA8DA", 300:"#7986CB",
        400:"#5C6BC0", 500:"#3F51B5", 600:"#3949AB", 700:"#303F9F",
        800:"#283593", 900:"#1B2A6B" }}
    },
    blue: {
      colors: { primary: { DEFAULT: "#1A6ED8", foreground: "#FFFFFF",
        50:"#E3F2FD", 100:"#BBDEFB", 200:"#90CAF9", 300:"#64B5F6",
        400:"#42A5F5", 500:"#2196F3", 600:"#1E88E5", 700:"#1976D2",
        800:"#1565C0", 900:"#1A6ED8" }}
    },
    green: {
      colors: { primary: { DEFAULT: "#2E7D32", foreground: "#FFFFFF",
        50:"#E8F5E9", 100:"#C8E6C9", 200:"#A5D6A7", 300:"#81C784",
        400:"#66BB6A", 500:"#4CAF50", 600:"#43A047", 700:"#388E3C",
        800:"#2E7D32", 900:"#1B5E20" }}
    },
    red: {
      colors: { primary: { DEFAULT: "#C62828", foreground: "#FFFFFF",
        50:"#FFEBEE", 100:"#FFCDD2", 200:"#EF9A9A", 300:"#E57373",
        400:"#EF5350", 500:"#F44336", 600:"#E53935", 700:"#D32F2F",
        800:"#C62828", 900:"#B71C1C" }}
    },
    purple: {
      colors: { primary: { DEFAULT: "#6A1B9A", foreground: "#FFFFFF",
        50:"#F3E5F5", 100:"#E1BEE7", 200:"#CE93D8", 300:"#BA68C8",
        400:"#AB47BC", 500:"#9C27B0", 600:"#8E24AA", 700:"#7B1FA2",
        800:"#6A1B9A", 900:"#4A148C" }}
    },
  }
})
```

### Theme switching function (in utils.js both repos):
```js
const THEMES = ['teal', 'navy', 'blue', 'green', 'red', 'purple'];
const THEME_LABELS = {
  teal:   { en: 'Teal',      ar: 'أخضر مائي' },
  navy:   { en: 'Navy Blue', ar: 'أزرق داكن' },
  blue:   { en: 'Blue',      ar: 'أزرق'      },
  green:  { en: 'Green',     ar: 'أخضر'      },
  red:    { en: 'Red',       ar: 'أحمر'       },
  purple: { en: 'Purple',    ar: 'بنفسجي'    },
};

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('leen_theme', theme);
}

function initTheme() {
  const saved = localStorage.getItem('leen_theme') || 'teal';
  applyTheme(saved);
  return saved;
}
```

### ThemeSelector component (src/components/ThemeSelector.jsx — both repos):
- Six circular color swatches in a row
- Active theme has a ring/border highlight
- Clicking a swatch calls applyTheme()
- Used on: Settings page (admin), Home screen (booking)
- Tooltip/label shows theme name in current language on hover

---

## Online / Offline System (both repos)

Both apps must handle unreliable internet gracefully. The system has four parts:

### Problem this solves
Google Sheets is the only database. If the Apps Script URL is unreachable
(bad Wi-Fi, mobile data dropout, Apps Script quota exceeded), data submitted
by the user would silently disappear. The offline system prevents data loss
and gives the user clear feedback at all times.

---

### Part 1 — useOnlineStatus hook (src/hooks/useOnlineStatus.js — both repos)

Detects real connectivity, not just browser online/offline events.
Browser events are unreliable — phone can show "connected" to Wi-Fi but
have no actual internet. This hook verifies by pinging the Apps Script.

```js
// Returns:
// {
//   isOnline: boolean,       — true if confirmed internet connection
//   status: string,          — 'online' | 'offline' | 'checking'
//   lastChecked: Date|null,  — when last ping happened
// }

// Behavior:
// - Listens to window 'online' and 'offline' events
// - Also pings APPS_SCRIPT_URL every 60 seconds with action=ping (60s keeps Apps Script quota usage low)
//   APPS_SCRIPT_URL imported from '../config.js' — NOT from api.js
//   (Apps Script returns { pong: true } for this action)
// - On window 'online' event: immediately re-pings to confirm
// - On window 'offline' event: sets status to 'offline' immediately
// - Status 'checking' shown only during the first ping or after reconnect
// - Exports: useOnlineStatus() hook
```

---

### Part 2 — offlineQueue module (src/offlineQueue.js — both repos)

Queues write operations when offline and replays them when back online.
Read operations (GET) are never queued — they just fail gracefully.
Only POST operations (writes) are queued.

```js
// localStorage key: 'leen_offline_queue'
// Queue item structure:
// {
//   id: string,             — unique queue ID (timestamp + random)
//   action: string,         — backend action name e.g. 'submitBooking'
//   data: object,           — full request body (already includes idempotencyKey)
//   idempotencyKey: string, — UUID generated when the user took the action (prevents duplicate writes on retry/multi-device sync)
//   queuedAt: string,       — ISO timestamp when queued
//   retries: number,        — how many sync attempts have failed (starts at 0)
// }

// Functions to implement:

enqueueRequest(action, data)
— Adds item to queue in localStorage
— Returns the queued item id
— Limit: max 50 items (prevents localStorage overflow)

getQueue()
— Returns full array of queued items (parsed from localStorage)
— Returns [] if localStorage key doesn't exist

getQueueCount()
— Returns number of items in queue

clearQueue()
— Empties the entire queue (used after successful full sync)

removeFromQueue(id)
— Removes one item by id (used after individual item syncs successfully)

async syncQueue(apiFn)
— Attempts to send all queued items
— apiFn is a reference to the raw POST fetch function from api.js
— For each item: call apiFn(item.action, item.data)
— On success: removeFromQueue(item.id)
— On failure: increment item.retries — if retries >= 3, remove it
  (it will never succeed — log it to console as a permanent failure)
— Returns { synced: number, failed: number }
```

---

### Part 3 — ConnectionBadge component (src/components/ConnectionBadge.jsx — both repos)

A small status indicator shown in the UI at all times so the user always
knows whether their data is being saved to Google Sheets or queued locally.

```jsx
// Props: none — reads state from useOnlineStatus() and offlineQueue directly

// Four visual states (HeroUI Chip component):
//
// 🟢 ONLINE  — color="success", small dot + "متصل" / "Connected"
//              shown when isOnline=true and queue is empty
//
// 🟡 CHECKING — color="warning", spinner + "جاري الاتصال..." / "Checking..."
//              shown when status='checking'
//
// 🔴 OFFLINE  — color="danger", icon + "غير متصل — X في الانتظار" / "Offline — X queued"
//              shown when isOnline=false
//              X = getQueueCount() — shows how many entries are waiting
//
// 🔵 SYNCING  — color="primary", spinner + "جاري المزامنة..." / "Syncing..."
//              shown when reconnected and syncQueue() is running

// Placement:
// — leen-booking: bottom of BookingForm page, above submit button
// — leen-admin: top-right corner of TopBar (mobile) and bottom of Sidebar (desktop)

// Behavior:
// — When status changes from offline → online: automatically call syncQueue()
// — Show SYNCING state during sync
// — After sync completes: show success toast with count of synced items
// — If sync has permanent failures: show warning toast
```

---

### Part 4 — api.js integration (both repos)

All POST functions in api.js must check connection before sending.
If offline, enqueue instead of fetch. On reconnect, syncQueue runs.

```js
// config.js — import from here, never from api.js inside hooks:
// export const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
// export const ORIGIN = window.location.origin;

// Pattern for every POST function in api.js:
// api.js imports from config.js (not from useOnlineStatus — avoids circular dependency)
import { APPS_SCRIPT_URL, ORIGIN } from './config';
import { getIsOnline } from './hooks/useOnlineStatus';
import { enqueueRequest } from './offlineQueue';

async function submitBooking(rawData) {
  // Generate an idempotency key ONCE, before any send/queue attempt.
  // This survives retries and multi-device sync — the server skips duplicates.
  const data = { ...rawData, idempotencyKey: rawData.idempotencyKey || crypto.randomUUID() };

  if (!getIsOnline()) {
    const queueId = enqueueRequest('submitBooking', data);
    return { success: true, queued: true, queueId, bookingId: 'PENDING-' + queueId };
  }
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      // text/plain avoids CORS preflight. Apps Script reads e.postData.contents + JSON.parse().
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'submitBooking', origin: ORIGIN, ...data }),
    });
    return await res.json();
  } catch (err) {
    const queueId = enqueueRequest('submitBooking', data);
    return { success: true, queued: true, queueId, bookingId: 'PENDING-' + queueId };
  }
}

// GET functions — no queuing, graceful error:
async function getTherapists() {
  try {
    const params = new URLSearchParams({ action: 'getTherapists', origin: ORIGIN });
    const res = await fetch(APPS_SCRIPT_URL + '?' + params);
    return await res.json();
  } catch (err) {
    return { success: false, error: 'No connection', cached: true };
  }
}

// rawPost — used by syncQueue only. Throws on failure (syncQueue handles retries):
export async function rawPost(action, data) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, origin: ORIGIN, ...data }),
  });
  return await res.json();
}
```

---

### Offline i18n strings (add to i18n.js in both repos):

```js
connection: {
  online:       { en: 'Connected',          ar: 'متصل'                    },
  offline:      { en: 'Offline',            ar: 'غير متصل'                },
  checking:     { en: 'Checking...',        ar: 'جاري الاتصال...'         },
  syncing:      { en: 'Syncing...',         ar: 'جاري المزامنة...'        },
  queued:       { en: '{n} items queued',   ar: '{n} عنصر في الانتظار'    },
  syncDone:     { en: '{n} items synced',   ar: 'تمت مزامنة {n} عنصر'    },
  syncFailed:   { en: 'Some items failed to sync', ar: 'فشلت مزامنة بعض العناصر' },
  offlineNote:  { en: 'Your data is saved and will sync when you reconnect.',
                  ar: 'تم حفظ بياناتك وستتم المزامنة عند الاتصال.' },
}
```

---

### Booking app — offline behavior:

- Client submits booking → if offline → queued → confirmation screen shows:
  "تم حفظ طلبك. سيُرسل عند الاتصال بالإنترنت." / "Request saved. Will be sent when connected."
  Booking reference shows as "PENDING-[id]" until confirmed
- When app comes back online → syncQueue runs → booking is actually submitted
- If client closes the app before reconnecting: queue survives in localStorage
  and will sync on next app open if internet is available

### Admin app — offline behavior:

- Read operations (loading tables, dashboard): show cached data if available,
  show "Offline — showing cached data" banner, disable action buttons
- Write operations (add transaction, add expense, confirm booking): queued
  with a clear "Will sync when reconnected" toast
- ConnectionBadge always visible in the corner
- When reconnected: auto-sync runs, success toast shows count

---

## Backend Abstraction Layer & Migration Path

**Core principle: `api.js` is the ONLY file that knows what the backend is.**
Every page and component calls `api.js` functions. No component ever calls fetch()
or knows about Apps Script, Google Sheets, action names, origin params, or text/plain.
This is what makes the future move to a real database (Supabase) a swap, not a rewrite.

### The data contract (must stay stable across backends)

Every api.js function returns one consistent envelope shape:

```js
// SUCCESS:  { success: true,  data: <result>, error: null }
// FAILURE:  { success: false, data: null,     error: 'message' }
// QUEUED:   { success: true,  queued: true, queueId, ...optimistic fields }
```

Function signatures and their return `data` shape are the contract. As long as a new
backend returns the same shapes, components never change. Examples:

- `getTherapists()` → `{ success, data: Therapist[], error }`
- `getAvailableSlots(therapistId, date)` → `{ success, data: string[], error }`
- `submitBooking(data)` → `{ success, data: { bookingId }, error }`
- `getTransactions(month, year)` → `{ success, data: { rows: Txn[], balance }, error }`

### When you migrate to Supabase (Stage 3 — future)

Google Sheets + Apps Script is the Stage 1 backend: zero cost, fine for low volume,
good for launch. When the center grows (more sessions, more concurrent use, privacy/
access-control needs), move to Supabase. To do this you ONLY rewrite the internals of
`api.js` in both repos:

1. Create a Supabase project (free tier: real Postgres + auth + row-level security).
2. Recreate the 7 tabs as Postgres tables (same columns — the schema already maps 1:1).
3. The Idempotency_Key columns become `UNIQUE` constraints → dedup is automatic via upsert.
4. The computed `Balance` becomes a SQL window function or a view.
5. Rewrite each api.js function to call `supabase.from('table')...` instead of fetch().
   Keep the SAME function names and SAME return envelope. Components don't change.
6. Replace the admin login (`verifyLogin`) with Supabase Auth.
7. Row-level security replaces the origin/referrer check — real access control.
8. Real-time: the admin "poll every 60s" can become a Supabase real-time subscription.

Nothing in pages/, components/, hooks/, offlineQueue.js, or i18n.js changes.
That is the entire point of routing everything through api.js.

### To keep migration clean while building on Sheets — follow these now:

- Never call fetch() outside api.js (Key Rule 12 already enforces this).
- Never reference action names, origin, or text/plain outside api.js / config.js.
- Always return the standard envelope shape from every api.js function.
- Keep idempotency keys on every write — Supabase will reuse them as unique constraints.
- Treat the offline queue as backend-agnostic: it stores { action, data, idempotencyKey }.
  When the backend changes, only rawPost() inside api.js changes — the queue is untouched.

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
| Fee               | Number   | EGP — looked up SERVER-SIDE from Therapists tab. Client-sent fee is ignored. |
| Revenue_Therapist | Number   | Formula: Fee × (Revenue_Share_Pct / 100)                   |
| Revenue_Center    | Number   | Formula: Fee − Revenue_Therapist                           |
| Status            | Text     | Pending / Confirmed / Cancelled / Completed / No-show      |
| Payment_Status    | Text     | Unpaid / Paid / Waived                                     |
| Payment_Method    | Text     | Cash / Bank transfer                                       |
| Video_Link        | Text     | Optional — Daily.co room URL for online sessions           |
| Reminder_Sent     | Boolean  | FALSE → TRUE after daily trigger fires                     |
| Confirmed_At      | DateTime | Auto: set when admin confirms                              |
| Idempotency_Key   | Text     | Client-generated UUID — Apps Script skips write if key already exists (dedup) |
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
| Fee_Group            | Number   | EGP — price per person for Group sessions      |
| Fee_Workshop         | Number   | EGP — total price for Workshop sessions        |
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
| Balance        | Number   | NOT stored — computed on read by Apps Script (avoids concurrency bugs). Leave column out of writes. |
| Method         | Text     | Cash / Bank transfer                                              |
| Booking_ID     | Text     | Optional — links to Bookings tab                                  |
| Idempotency_Key| Text     | Client-generated UUID — Apps Script skips write if key already exists (dedup) |
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
| Idempotency_Key | Text | Client-generated UUID — Apps Script skips write if key already exists (dedup) |
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

### Ping endpoint (for useOnlineStatus hook):
The Apps Script must respond to action=ping:
```js
if (action === 'ping') {
  return cors({ pong: true });
}
```
This is used by the useOnlineStatus hook to verify real connectivity every 60 seconds.

IMPORTANT: The Apps Script project timezone must be set to Africa/Cairo (Project Settings → Time zone). All date math and Utilities.formatDate() calls must pass 'Africa/Cairo'. A wrong timezone puts slots and reminders on the wrong day.

### GET endpoints (action parameter):
| Action                   | Parameters           | Returns                                        |
|--------------------------|----------------------|------------------------------------------------|
| ping                     | —                    | { pong: true } — used by connection checker    |
| getTherapists            | —                    | All active therapists (for client app)         |
| getAvailableSlots        | therapistId, date    | Available time slots for that day             |
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
| verifyLogin      | Compares passwordHash server-side, returns success/fail — hash never sent to browser |

---

## Security Model

- Apps Script URL: stored in localStorage by the admin — never in any code file or GitHub.
  In src/config.js: `export const APPS_SCRIPT_URL = localStorage.getItem('leen_script_url') || '';`
  Admin enters the URL once in the Settings page → saved to localStorage → used from then on.
  No .env files, no GitHub secrets, no env vars. URL is completely invisible in the codebase.
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
5. **BookingForm** — Booking summary at top. Fields: Name (required), Phone (required), Email (optional), Notes (optional). Submit button. ConnectionBadge shown above submit button.
6. **Confirmation** — Success message. Booking summary. "We'll confirm within 24 hours." Center phone. "Add to calendar" link. "Book another" button. If booking was queued offline, show a note explaining it will sync automatically.
7. **InstallPrompt** — Small banner on second visit. "Add to home screen." Dismissable.
8. **Offline** — Shown by service worker when no connection. Retry button.

### File Structure
```
leen-booking/
  CLAUDE.md
  BUILD.md
  .env.local          ← git-ignored — contains VITE_APPS_SCRIPT_URL for local dev
  .gitignore          ← must include .env.local
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
    config.js           ← APPS_SCRIPT_URL + ORIGIN — imported by api.js AND useOnlineStatus.js
    index.css           ← Tailwind directives (@tailwind base/components/utilities)
    main.jsx            ← React entry: I18nProvider + RouterProvider (HeroUI v3 has NO HeroUIProvider)
    App.jsx             ← Route definitions
    api.js              ← All Apps Script fetch calls + offline queue integration
    i18n.js             ← All AR/EN translation strings (includes connection strings)
    offlineQueue.js     ← Queue management: enqueue, sync, localStorage
    hooks/
      useOnlineStatus.js ← Real connectivity detection via ping (imports APPS_SCRIPT_URL from config.js)
    pages/
      Home.jsx
      Therapists.jsx
      TherapistProfile.jsx
      SlotPicker.jsx
      BookingForm.jsx
      Confirmation.jsx
    components/
      TherapistCard.jsx
      SlotGrid.jsx
      LanguageToggle.jsx
      InstallPrompt.jsx
      OfflineScreen.jsx
      LoadingSpinner.jsx
      ConnectionBadge.jsx ← Connection status indicator
      ThemeSelector.jsx
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
3. **Sessions** — Full bookings table. Filters: therapist, date range, status, payment status. Per-row: confirm, cancel, mark paid actions. Revenue split shown per row. Export to Excel.
4. **CashFlow** — Transaction log table. Add transaction form. Running balance always visible. Export to Excel.
5. **Expenses** — Expense log table. Add expense form. Expected vs actual per category. Category breakdown bar chart. Flag over-budget in red. Export to Excel.
6. **Payouts** — Per-therapist cards: total earned, paid out, pending. Mark payout as settled. Export payout report.
7. **TherapistMgmt** — Therapist list. Edit form per therapist. Block date form.
8. **Clients** — Client directory. Search by name or phone. Expand for full session history.
9. **Reports** — Month/year selector. Income statement. Year-to-date chart. Export all.
10. **Settings** — Change password. JSON backup. Theme selector. Language toggle.

### Responsive layout:
- Desktop (≥768px): persistent left sidebar navigation, multi-column layouts, full tables
- Mobile (<768px): top bar with page title, bottom tab navigation, single column, cards instead of wide tables

### File Structure
```
leen-admin/
  CLAUDE.md
  BUILD.md
  .env.local          ← git-ignored — contains VITE_APPS_SCRIPT_URL for local dev
  .gitignore          ← must include .env.local
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
    config.js           ← APPS_SCRIPT_URL + ORIGIN — imported by api.js AND useOnlineStatus.js
    index.css           ← Tailwind directives (@tailwind base/components/utilities)
    main.jsx
    App.jsx
    api.js              ← All Apps Script calls + offline queue integration
    i18n.js             ← All AR/EN strings (includes connection strings)
    auth.js
    offlineQueue.js     ← Queue management: enqueue, sync, localStorage
    hooks/
      useOnlineStatus.js ← Real connectivity detection via ping (imports APPS_SCRIPT_URL from config.js)
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
      AppShell.jsx
      Sidebar.jsx
      BottomNav.jsx
      TopBar.jsx
      AuthGuard.jsx
      StatCard.jsx
      DataTable.jsx
      RevenueChart.jsx
      ExpenseChart.jsx
      LanguageToggle.jsx
      LoadingSpinner.jsx
      ConfirmModal.jsx
      BackupButton.jsx
      ConnectionBadge.jsx ← Connection status indicator (in TopBar + Sidebar)
      ThemeSelector.jsx
    utils/
      excel.js
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
    connection: {
      online: "Connected", offline: "Offline", checking: "Checking...",
      syncing: "Syncing...", queued: "{n} items queued",
      syncDone: "{n} items synced", syncFailed: "Some items failed to sync",
      offlineNote: "Your data is saved and will sync when you reconnect.",
    },
    // ... all other strings
  },
  ar: {
    nav: { dashboard: "الرئيسية", sessions: "الجلسات", ... },
    actions: { confirm: "تأكيد", cancel: "إلغاء", save: "حفظ", ... },
    booking: { bookSession: "احجز جلسة", selectDate: "اختر تاريخاً", ... },
    connection: {
      online: "متصل", offline: "غير متصل", checking: "جاري الاتصال...",
      syncing: "جاري المزامنة...", queued: "{n} عنصر في الانتظار",
      syncDone: "تمت مزامنة {n} عنصر", syncFailed: "فشلت مزامنة بعض العناصر",
      offlineNote: "تم حفظ بياناتك وستتم المزامنة عند الاتصال.",
    },
    // ... all other strings
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

// Theme functions
applyTheme(theme), initTheme() — as defined in Theme System section

// Visit counter (for install prompt)
getVisitCount() → increments and returns visit count from localStorage

// Calendar link generator
generateCalendarLink(booking) → Google Calendar URL string
```

---

## Key Rules for Claude Code

1. Always read CLAUDE.md fully at the start of every session.
2. Never hardcode display strings — always use the `t()` function from useI18n().
3. Never hardcode the Apps Script URL — always import it from `src/config.js` which reads from localStorage key 'leen_script_url'. The URL is set once by the admin in the Settings page.
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
14. ALL POST functions in api.js must check isOnline before fetching — queue if offline.
15. ALL GET functions in api.js must have try/catch and return a graceful error object if they fail.
16. ConnectionBadge must be visible at all times — in TopBar (mobile admin), Sidebar (desktop admin), and BookingForm (booking app).
17. Never let a failed network request crash the app silently — always show the user what happened.
18. APPS_SCRIPT_URL lives only in src/config.js — imported from there by both api.js and useOnlineStatus.js. Never import it from api.js inside a hook (circular dependency).
19. POST requests to Apps Script must use Content-Type: text/plain — never application/json. Apps Script reads body via e.postData.contents + JSON.parse().
20. Never call getSettings from the browser to fetch the password hash. Login verification is server-side via verifyLogin action only.
21. The Apps Script URL lives only in localStorage ('leen_script_url'). It is set via the Settings page. No GitHub secrets, no .env files, no env vars needed. If the URL is empty the app shows a setup prompt to the admin.
22. Every api.js function returns the standard envelope: { success, data, error }. Components depend on this shape, never on backend specifics. This is the contract that makes the Supabase migration a swap.
23. Every POST/write generates an idempotencyKey (crypto.randomUUID()) before sending OR queuing. The server skips the write if the key already exists. Prevents duplicates on retry and multi-device offline sync.
24. The Balance in Transactions is computed on read by the backend — never written by the client and never stored as a column value during writes.
25. React 19 + HeroUI v3: there is NO HeroUIProvider. Use I18nProvider from @heroui/react only to set the locale (ar-EG / en-US) for RTL. Components work without any provider.
26. submitBooking validates the fee SERVER-SIDE from the Therapists tab — never trust the fee, Revenue_Therapist, or Revenue_Center sent by the client.
27. The connectivity ping must bypass all caching (cache: 'no-store' + cache-buster query param) and be excluded from Workbox runtimeCaching — a cached pong while offline breaks offline detection.

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
→ Then start leen-admin Stage 8-A (admin first)
