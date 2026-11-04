-- ============================================================================
-- BAHRIA NAVY SCHOOL PORTAL · 02 — ROW LEVEL SECURITY POLICIES
-- Run AFTER 01-schema.sql.
-- Security model:
--   · Public (anon)  : read published content, insert admissions & enquiries.
--   · Applicants     : can NEVER select admissions directly — only via the
--                      track_application RPC (reference + phone verified).
--   · Admin          : full access to everything, enforced by is_admin().
-- ============================================================================

alter table public.profiles          enable row level security;
alter table public.academic_years    enable row level security;
alter table public.classes           enable row level security;
alter table public.admissions        enable row level security;
alter table public.admission_history enable row level security;
alter table public.students          enable row level security;
alter table public.notices           enable row level security;
alter table public.events            enable row level security;
alter table public.gallery_items     enable row level security;
alter table public.faculty           enable row level security;
alter table public.achievements      enable row level security;
alter table public.history_items     enable row level security;
alter table public.site_settings     enable row level security;
alter table public.contact_messages  enable row level security;
alter table public.audit_logs        enable row level security;

-- ---------------------------------------------------------------------------
-- profiles: read/update own; admins read/update all; roles guarded by trigger.
-- ---------------------------------------------------------------------------
drop policy if exists "profiles: select own"    on public.profiles;
drop policy if exists "profiles: admin select"  on public.profiles;
drop policy if exists "profiles: update own"    on public.profiles;
drop policy if exists "profiles: admin update"  on public.profiles;

create policy "profiles: select own"   on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles: admin select" on public.profiles for select to authenticated using (public.is_admin());
create policy "profiles: update own"   on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles: admin update" on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- public content: readable by everyone when published / active; admin full.
-- ---------------------------------------------------------------------------

-- academic_years
drop policy if exists "years: public read"  on public.academic_years;
drop policy if exists "years: admin write"  on public.academic_years;
create policy "years: public read" on public.academic_years for select to public using (true);
create policy "years: admin write" on public.academic_years for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- classes
drop policy if exists "classes: public read" on public.classes;
drop policy if exists "classes: admin write" on public.classes;
create policy "classes: public read" on public.classes for select to public using (true);
create policy "classes: admin write" on public.classes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- notices (only published & unexpired for the public)
drop policy if exists "notices: public read" on public.notices;
drop policy if exists "notices: admin write" on public.notices;
create policy "notices: public read" on public.notices for select to public
  using (
    status = 'published'
    and (publish_at is null or publish_at <= now())
    and (expires_at is null or expires_at > now())
  );
create policy "notices: admin write" on public.notices for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- events
drop policy if exists "events: public read" on public.events;
drop policy if exists "events: admin write" on public.events;
create policy "events: public read" on public.events for select to public using (status = 'published');
create policy "events: admin write" on public.events for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- gallery_items
drop policy if exists "gallery: public read" on public.gallery_items;
drop policy if exists "gallery: admin write" on public.gallery_items;
create policy "gallery: public read" on public.gallery_items for select to public using (status = 'published');
create policy "gallery: admin write" on public.gallery_items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- faculty
drop policy if exists "faculty: public read" on public.faculty;
drop policy if exists "faculty: admin write" on public.faculty;
create policy "faculty: public read" on public.faculty for select to public using (is_active = true);
create policy "faculty: admin write" on public.faculty for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- achievements
drop policy if exists "achievements: public read" on public.achievements;
drop policy if exists "achievements: admin write" on public.achievements;
create policy "achievements: public read" on public.achievements for select to public using (is_active = true);
create policy "achievements: admin write" on public.achievements for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- history_items
drop policy if exists "history: public read" on public.history_items;
drop policy if exists "history: admin write" on public.history_items;
create policy "history: public read" on public.history_items for select to public using (is_active = true);
create policy "history: admin write" on public.history_items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- site_settings: public read, admin write
drop policy if exists "settings: public read" on public.site_settings;
drop policy if exists "settings: admin write" on public.site_settings;
create policy "settings: public read" on public.site_settings for select to public using (true);
create policy "settings: admin write" on public.site_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- admissions: anonymous can APPLY (insert) but never read.
-- Only admins can read / review / update / delete.
-- ---------------------------------------------------------------------------
drop policy if exists "admissions: anyone can apply" on public.admissions;
drop policy if exists "admissions: admin read"       on public.admissions;
drop policy if exists "admissions: admin update"     on public.admissions;
drop policy if exists "admissions: admin delete"     on public.admissions;

create policy "admissions: anyone can apply" on public.admissions for insert to public with check (true);
create policy "admissions: admin read"       on public.admissions for select to authenticated using (public.is_admin());
create policy "admissions: admin update"     on public.admissions for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admissions: admin delete"     on public.admissions for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- admission_history: admin only (applicants use the RPC).
-- ---------------------------------------------------------------------------
drop policy if exists "history: admin read"   on public.admission_history;
drop policy if exists "history: admin insert" on public.admission_history;
create policy "history: admin read"   on public.admission_history for select to authenticated using (public.is_admin());
create policy "history: admin insert" on public.admission_history for insert to authenticated with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- students: admin only.
-- ---------------------------------------------------------------------------
drop policy if exists "students: admin all" on public.students;
create policy "students: admin all" on public.students for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- contact_messages: anyone can submit; admin manages.
-- ---------------------------------------------------------------------------
drop policy if exists "messages: anyone can submit" on public.contact_messages;
drop policy if exists "messages: admin all"         on public.contact_messages;
create policy "messages: anyone can submit" on public.contact_messages for insert to public with check (true);
create policy "messages: admin all"         on public.contact_messages for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- audit_logs: admin insert + read.
-- ---------------------------------------------------------------------------
drop policy if exists "audit: admin insert" on public.audit_logs;
drop policy if exists "audit: admin read"   on public.audit_logs;
create policy "audit: admin insert" on public.audit_logs for insert to authenticated with check (public.is_admin());
create policy "audit: admin read"   on public.audit_logs for select to authenticated using (public.is_admin());

-- ============================================================================
-- NOTES
-- · `to public` covers anon + authenticated roles on that statement.
-- · Never grant table grants wider than these policies require.
-- · Applicants' documents live in a PRIVATE storage bucket (03-storage.sql).
-- ============================================================================
