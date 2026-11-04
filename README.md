# Bahria College — Navy-Inspired School Website & Admission Portal

A complete, premium **navy-inspired** school website with an **online admission portal** and a secure **admin dashboard**, built with **React + Vite + Supabase** (PostgreSQL · Auth · Storage · Row Level Security) and cinematic **GSAP + Three.js** animation.

> Design concept: deep navy · ceremonial gold · clean white · restrained motion.
> All sample content is clearly labelled — replace it with approved school information before going live.

---

## 1. Features

**Public website** — Home (3D ocean hero, animated headline, stats, notices, gallery preview), About (history, timeline, leadership), Academics, Faculty (search + filters), Achievements & Alumni, School History & Important Visitors, Events & Gallery (lightbox, videos), Notices (urgent/holiday/admission tabs, expiry), Contact (validated form → database), printable pages.

**Admission portal** — guided 5-step application (Student → Parent → Academic → Documents → Review), validation, document uploads to a **private** storage bucket, duplicate-submission blocking (database fingerprint), unique reference number (`BA-XX-XXXXXX`), printable receipt, status tracking (reference no. + guardian phone verified in the database via RPC).

**Admin dashboard** — statistics & trends, application review workflow (approve / reject / request corrections with notes + full status history), one-click conversion of approved applications into student records (duplicates blocked by the DB), student management, notices & urgent banner management (pin, expiry, audience), events, gallery, faculty, achievements, history/visitors, website content editor (no code changes needed), classes & academic years, enquiries inbox, CSV export, printable reports, audit log.

**Security** — Supabase Auth, role stored in `profiles` (only an existing admin or the SQL editor can grant `admin`), **RLS on every table**, anonymous users can apply but can never read admission data, applicants verify themselves via `reference + phone` RPC, private document bucket with admin-only signed-URL access, audit logging.

---

## 2. Tech stack

| Layer      | Choice |
|------------|--------|
| Frontend   | React 18 + Vite 5, React Router 6, Tailwind CSS 4 |
| Animation  | GSAP 3 + ScrollTrigger, Lenis smooth scroll, Three.js + React Three Fiber (custom shader ocean scene) |
| Backend    | **Supabase only** — PostgreSQL, Auth, Storage, RLS (no Express, no MongoDB) |

---

## 3. Project structure

```
bahria-navy-school/
├── index.html                  # fonts, favicon, boot splash
├── package.json
├── vite.config.js
├── .env.example                # copy to .env and fill in
├── supabase/
│   ├── 01-schema.sql           # tables, triggers, indexes, tracking RPCs
│   ├── 02-policies.sql         # Row Level Security for every table
│   ├── 03-storage.sql          # buckets + storage policies
│   └── 04-seed.sql             # labelled sample content (optional)
├── public/
│   ├── logos/                  # supplied school crest + Navy badge
│   └── placeholders/           # sample images (replace with real photos)
└── src/
    ├── lib/                    # supabase client, api layer, utils, settings
    ├── context/                # auth + toast providers
    ├── hooks/                  # useAsync, smooth scroll, site settings
    ├── components/
    │   ├── ui/                 # motion (GSAP), modals, fields, icons, bits
    │   ├── layout/             # navbar, footer, urgent banner, transitions
    │   ├── admin/              # admin sidebar layout, generic CRUD engine
    │   └── three/              # OceanScene (R3F shader waves + stars)
    └── pages/
        ├── public/             # 9 website pages
        ├── admission/          # portal landing, wizard, status tracking
        ├── auth/               # admin login
        └── admin/              # dashboard + 13 management screens
```

---

## 4. Quick start (Windows)

**Prerequisite:** install Node.js LTS from <https://nodejs.org> (v18 or newer). Then open **Command Prompt** in the extracted project folder:

```bat
:: 1) install dependencies
npm install

:: 2) create your env file
copy .env.example .env
::    then open .env in Notepad and paste your Supabase URL + anon key

:: 3) run the dev server
npm run dev
```

Open the printed local URL (default `http://localhost:5173`).

**Production build:**

```bat
npm run build
npm run preview
```

---

## 5. Connect your Supabase project (step by step)

1. **Create the project** at <https://supabase.com> → *New project* (any name, e.g. `bahria-school-portal`).
2. **Run the SQL files in order** — Dashboard → *SQL Editor* → *New query* → paste the full contents of each file → **Run**:
   1. `supabase/01-schema.sql`
   2. `supabase/02-policies.sql`
   3. `supabase/03-storage.sql`
   4. `supabase/04-seed.sql` *(optional — labelled sample content)*
3. **Get your credentials** — *Project Settings → API*:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - Paste both into `.env`, then restart `npm run dev`.
4. **Create the first admin** (below).

> The **anon key is safe for the browser** — all privilege separation is enforced server-side by RLS. Never place the `service_role` secret key in any frontend file.

### Create the first admin

There is **no public sign-up** — that is deliberate security, not a missing feature.

1. Supabase Dashboard → **Authentication → Users → Add user** → enter an email + password (auto-confirm).
2. Copy the new user's **UID** from the users table.
3. SQL Editor → run (replace the UUID):

   ```sql
   update public.profiles set role = 'admin', full_name = 'School Admin'
   where id = 'PASTE-USER-UUID-HERE';
   ```

4. Sign in at `/admin/login` in the app.

To add more admins later: an admin can change `profiles.role` from the SQL editor, or run the same statement for the new user's UID.

---

## 6. What the admin can manage (no code required)

| Screen | Capabilities |
|---|---|
| Dashboard | Totals, pending/approved/rejected/correction counts, 14-day trend, class-wise stats, recent applications, audit feed |
| Applications | Search, filter by status/class, sort, paginate; review full details; open submitted documents (signed URLs); approve / reject / request correction with notes; remarks; convert approved application → student |
| Students | Search, add manually, edit, delete; link back to the source application |
| Notices & Alerts | Publish/unpublish/archive, urgent emergency banner, pin to homepage, category, audience, publish time, expiry |
| Enquiries | Contact-form inbox with read/unread, reply via email, delete |
| Events / Gallery / Faculty / Achievements / History | Full CRUD with image upload to Supabase Storage |
| Website Content | Every public heading & text (hero, welcome, principal's message, mission/vision/values, facilities, stats, about, admissions info, contact details, map embed, social links) |
| Classes & Years | Manage classes and the active academic year used by the admission form |
| Reports & Audit | CSV export with filters, printable summary, audit log of admin actions |

---

## 7. Testing checklist (done / needs your credentials)

**Verified in this environment:**

- [x] `npm install` completes cleanly and `npm run build` succeeds (production bundle).
- [x] All imports/routes/components resolve (Vite build fails on missing imports).
- [x] App renders a clear setup screen instead of crashing when `.env` is missing.
- [x] Responsive layout classes and reduced-motion fallbacks throughout.
- [x] Forms validate (admission wizard per-step, contact form, admin forms).
- [x] Print styles for receipt / application / report (`.print-area`).
- [x] SQL files are ordered, idempotent, and use `security definer` RPCs for tracking.

**Requires your Supabase project to verify end-to-end** (cannot be tested without credentials):

- [ ] Admin login + role gating (create the first admin as in §5).
- [ ] Admission submission → appears in admin list → approve → convert to student.
- [ ] Document upload + signed-URL viewing in the application detail page.
- [ ] Status tracking with reference number + phone (RPC).
- [ ] Urgent notice appears as the red top banner.
- [ ] Image uploads in admin CRUD screens.

---

## 8. Deployment

**Vercel / Netlify (recommended):**

1. Push the project to GitHub.
2. Import the repo in Vercel/Netlify → framework preset **Vite**.
   - Build command: `npm run build` · Output directory: `dist`
3. Add the two environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
4. In Supabase → Authentication → URL Configuration, add your deployed domain to **Site URL / Redirect URLs**.

**School network / local demo:** `npm run build` then host the `dist/` folder, or simply run `npm run dev` on the presentation laptop.

---

## 9. Official content & assets you must provide

Replace every sample/placeholder before the school goes live:

- Official school name, tagline, establishment year and approved history text
- Approved principal's message + photograph; leadership and staff profiles
- Real campus, classroom, event and ceremony photographs (upload via Admin screens)
- Verified examination results, positions, awards, scholarships and alumni records
- Verified visitor names, designations, dates and photographs (Navy / PNET history)
- Official address, phone, email, office hours, Google Maps embed URL
- Approved admission requirements, documents list and fee note
- The two supplied logos are already included in `public/logos/` (used in navbar, footer, login, receipt)

---

## 10. Troubleshooting

| Symptom | Fix |
|---|---|
| “Supabase is not configured” screen | `.env` missing/empty → copy `.env.example`, fill both values, restart dev server |
| Login works but “Access restricted” | The account's `profiles.role` is not `'admin'` → run the SQL from §5 step 3 |
| Uploads fail | Confirm `03-storage.sql` ran; check file type (PDF/JPG/PNG) and size (≤ 5 MB) |
| Tracking says “no application found” | Reference number and guardian phone must match the submission exactly (spaces ignored, last 4 digits of phone) |
| Charts/pages empty on first run | Expected until admins add content or `04-seed.sql` is run |
| Port 5173 busy | `npm run dev -- --port 3000` |

---

Built as a Class 9 school competition project — navy discipline, modern engineering. ⚓
#   B a h r i a S N S  
 