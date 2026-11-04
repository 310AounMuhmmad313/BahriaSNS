-- ============================================================================
-- BAHRIA NAVY SCHOOL PORTAL — ALL-IN-ONE SETUP SCRIPT
-- INSTRUCTIONS:
--   1. Supabase Dashboard -> SQL Editor -> New query
--   2. Paste this ENTIRE file and press RUN (only once)
--   3. That's it — schema + policies + storage + sample content, in order.
--   Safe to re-run (all statements are idempotent).
-- ============================================================================

/* ============================ PART 1/4 : SCHEMA ============================ */

-- ============================================================================
-- BAHRIA NAVY SCHOOL PORTAL · 01 — DATABASE SCHEMA
-- Run this FIRST in the Supabase SQL Editor (Dashboard → SQL Editor).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles — linked to Supabase Auth users. Roles: admin | staff
-- IMPORTANT: this table is created BEFORE is_admin() below, because
-- PostgreSQL validates `language sql` function bodies at creation time.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  role        text not null default 'staff' check (role in ('admin', 'staff')),
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helper: is the current authenticated user an admin?
-- SECURITY DEFINER so it can read `profiles` inside RLS policies.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Auto-create a profile whenever a new auth user appears.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'staff'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Guard: only admins may change roles (blocks self-promotion).
-- auth.uid() is null when running trusted SQL (dashboard SQL editor) —
-- those statements are allowed; browser sessions must be admins.
create or replace function public.guard_role_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if old.role is distinct from new.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only admins can change user roles';
  end if;
  return new;
end $$;

drop trigger if exists guard_role_change on public.profiles;
create trigger guard_role_change
  before update on public.profiles
  for each row execute function public.guard_role_change();

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- academic_years + classes
-- ---------------------------------------------------------------------------
create table if not exists public.academic_years (
  id         uuid primary key default gen_random_uuid(),
  label      text not null unique,
  is_active  boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  level         int,
  description   text,
  display_order int not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- admissions — online applications (anonymous insert, admin-only read)
-- ---------------------------------------------------------------------------
create table if not exists public.admissions (
  id                    uuid primary key default gen_random_uuid(),
  reference_no          text not null unique,
  submission_fingerprint text not null unique,
  class_id              uuid references public.classes(id) on delete set null,
  academic_year_id      uuid references public.academic_years(id) on delete set null,
  -- student
  student_name          text not null,
  date_of_birth         date not null,
  gender                text check (gender in ('male', 'female')),
  nationality           text not null default 'Pakistani',
  present_address       text not null,
  -- guardian
  guardian_name         text not null,
  guardian_relation     text not null default 'Father',
  guardian_cnic         text,
  guardian_phone        text not null,
  guardian_email        text,
  guardian_occupation   text,
  -- previous school
  previous_school       text not null,
  last_class_passed     text,
  previous_percentage   numeric(5, 2) check (previous_percentage between 0 and 100),
  -- documents: [{label, path, name, size, type}]
  documents             jsonb not null default '[]'::jsonb,
  -- review
  status                text not null default 'pending'
                        check (status in ('pending', 'approved', 'rejected', 'correction_requested')),
  remarks               text,
  reviewed_by           uuid references auth.users(id) on delete set null,
  reviewed_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists admissions_status_idx      on public.admissions (status);
create index if not exists admissions_created_idx     on public.admissions (created_at desc);
create index if not exists admissions_class_idx       on public.admissions (class_id);

drop trigger if exists touch_admissions on public.admissions;
create trigger touch_admissions before update on public.admissions
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- admission_history — every status change with notes and reviewer
-- ---------------------------------------------------------------------------
create table if not exists public.admission_history (
  id           uuid primary key default gen_random_uuid(),
  admission_id uuid not null references public.admissions(id) on delete cascade,
  status       text not null,
  note         text,
  changed_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists admission_history_admission_idx on public.admission_history (admission_id);
create index if not exists admission_history_created_idx   on public.admission_history (created_at);

-- Seed the first history row ("pending") when an application is created.
create or replace function public.seed_admission_history()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.admission_history (admission_id, status, note)
  values (new.id, 'pending', 'Application received.');
  return new;
end $$;

drop trigger if exists seed_admission_history on public.admissions;
create trigger seed_admission_history
  after insert on public.admissions
  for each row execute function public.seed_admission_history();

-- ---------------------------------------------------------------------------
-- students — approved / manually managed student records
-- ---------------------------------------------------------------------------
create table if not exists public.students (
  id               uuid primary key default gen_random_uuid(),
  admission_id     uuid unique references public.admissions(id) on delete set null,
  student_name     text not null,
  date_of_birth    date,
  gender           text,
  guardian_name    text,
  guardian_phone   text,
  class_id         uuid references public.classes(id) on delete set null,
  academic_year_id uuid references public.academic_years(id) on delete set null,
  roll_no          text,
  status           text not null default 'active' check (status in ('active', 'graduated', 'transferred', 'inactive')),
  notes            text,
  photo_url        text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists students_class_idx on public.students (class_id);

drop trigger if exists touch_students on public.students;
create trigger touch_students before update on public.students
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- notices — incl. urgent announcements (emergency banner / pin)
-- ---------------------------------------------------------------------------
create table if not exists public.notices (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  body          text not null,
  category      text not null default 'general' check (category in ('urgent', 'holiday', 'admission', 'event', 'general')),
  audience      text not null default 'all' check (audience in ('all', 'students', 'parents', 'staff')),
  is_emergency  boolean not null default false,
  pinned        boolean not null default false,
  status        text not null default 'published' check (status in ('published', 'unpublished', 'archived')),
  publish_at    timestamptz not null default now(),
  expires_at    timestamptz,
  media_url     text,
  media_type    text check (media_type in ('image', 'video', 'file')),
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists notices_status_idx on public.notices (status, publish_at desc);

drop trigger if exists touch_notices on public.notices;
create trigger touch_notices before update on public.notices
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- events + gallery_items
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  event_date  date not null,
  location    text,
  category    text not null default 'general',
  cover_url   text,
  video_url   text,
  status      text not null default 'published' check (status in ('published', 'unpublished')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists touch_events on public.events;
create trigger touch_events before update on public.events
  for each row execute function public.touch_updated_at();

create table if not exists public.gallery_items (
  id         uuid primary key default gen_random_uuid(),
  title      text,
  caption    text,
  url        text not null,
  type       text not null default 'image' check (type in ('image', 'video')),
  category   text not null default 'general',
  event_id   uuid references public.events(id) on delete set null,
  status     text not null default 'published' check (status in ('published', 'unpublished')),
  created_at timestamptz not null default now()
);

create index if not exists gallery_event_idx on public.gallery_items (event_id);

-- ---------------------------------------------------------------------------
-- faculty / achievements / history_items
-- ---------------------------------------------------------------------------
create table if not exists public.faculty (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  designation   text not null,
  category      text not null default 'teacher' check (category in ('principal', 'vice_principal', 'teacher', 'staff')),
  department    text,
  qualification text,
  bio           text,
  photo_url     text,
  display_order int not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists touch_faculty on public.faculty;
create trigger touch_faculty before update on public.faculty
  for each row execute function public.touch_updated_at();

create table if not exists public.achievements (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  category     text not null default 'award' check (category in ('result', 'award', 'competition', 'scholarship', 'alumni')),
  year         int,
  student_name text,
  image_url    text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.history_items (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  description         text,
  item_type           text not null default 'milestone' check (item_type in ('milestone', 'visit')),
  date_label          text,
  sort_date           date,
  visitor_name        text,
  visitor_designation text,
  image_url           text,
  display_order       int not null default 0,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- site_settings — editable website content (key/value)
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- ---------------------------------------------------------------------------
-- contact_messages — public enquiry form submissions
-- ---------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  phone      text,
  subject    text not null,
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);

-- ---------------------------------------------------------------------------
-- audit_logs — important admin actions
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references auth.users(id) on delete set null,
  actor_email text,
  action      text not null,
  entity      text,
  entity_id   text,
  details     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

-- ============================================================================
-- PUBLIC RPCs — application status tracking.
-- Verifies the applicant by reference number + guardian phone (last 4 digits)
-- inside the database, so private records are never exposed to arbitrary reads.
-- ============================================================================
create or replace function public.track_application(p_reference text, p_phone text)
returns table (
  ref_no        text,
  student_name  text,
  class_name    text,
  year_label    text,
  status        text,
  remarks       text,
  submitted_at  timestamptz
)
language plpgsql stable security definer set search_path = public
as $$
begin
  if p_reference is null or p_phone is null then
    return;
  end if;
  return query
    select
      a.reference_no,
      a.student_name,
      c.name,
      y.label,
      a.status,
      a.remarks,
      a.created_at
    from public.admissions a
    left join public.classes c on c.id = a.class_id
    left join public.academic_years y on y.id = a.academic_year_id
    where upper(trim(a.reference_no)) = upper(trim(p_reference))
      and right(regexp_replace(coalesce(a.guardian_phone, ''), '[^0-9]', '', 'g'), 4)
        = right(regexp_replace(p_phone, '[^0-9]', '', 'g'), 4)
    limit 1;
end $$;

create or replace function public.track_application_history(p_reference text, p_phone text)
returns table (
  status     text,
  note       text,
  changed_at timestamptz
)
language plpgsql stable security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_reference is null or p_phone is null then
    return;
  end if;
  select a.id into v_id
  from public.admissions a
  where upper(trim(a.reference_no)) = upper(trim(p_reference))
    and right(regexp_replace(coalesce(a.guardian_phone, ''), '[^0-9]', '', 'g'), 4)
      = right(regexp_replace(p_phone, '[^0-9]', '', 'g'), 4)
  limit 1;

  if v_id is null then
    return;
  end if;

  return query
    select h.status, h.note, h.created_at
    from public.admission_history h
    where h.admission_id = v_id
    order by h.created_at asc;
end $$;

grant execute on function public.track_application(text, text)          to anon, authenticated;
grant execute on function public.track_application_history(text, text)  to anon, authenticated;

/* ============================ PART 2/4 : SECURITY POLICIES ================= */

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

/* ============================ PART 3/4 : STORAGE BUCKETS =================== */

-- ============================================================================
-- BAHRIA NAVY SCHOOL PORTAL · 03 — STORAGE BUCKETS & POLICIES
-- Run AFTER 01 + 02.
-- Buckets:
--   public-media        (public)   — gallery, event covers, faculty photos,
--                                    notice posters, achievement photos.
--   admission-documents (PRIVATE)  — birth certificates, B-forms, report cards…
--                                    Only admins can view (signed URLs).
-- ============================================================================

-- create buckets (idempotent)
insert into storage.buckets (id, name, public)
values ('public-media', 'public-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('admission-documents', 'admission-documents', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- public-media: everyone reads; admins write.
-- ---------------------------------------------------------------------------
drop policy if exists "media: public read"    on storage.objects;
drop policy if exists "media: admin insert"   on storage.objects;
drop policy if exists "media: admin update"   on storage.objects;
drop policy if exists "media: admin delete"   on storage.objects;

create policy "media: public read"  on storage.objects for select to public
  using (bucket_id = 'public-media');
create policy "media: admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'public-media' and public.is_admin());
create policy "media: admin update" on storage.objects for update to authenticated
  using (bucket_id = 'public-media' and public.is_admin())
  with check (bucket_id = 'public-media' and public.is_admin());
create policy "media: admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'public-media' and public.is_admin());

-- ---------------------------------------------------------------------------
-- admission-documents:
--   · applicants (anon) may UPLOAD only
--   · only admins may READ / update / delete (app UI uses signed URLs)
-- ---------------------------------------------------------------------------
drop policy if exists "docs: anyone upload"  on storage.objects;
drop policy if exists "docs: admin read"     on storage.objects;
drop policy if exists "docs: admin update"   on storage.objects;
drop policy if exists "docs: admin delete"   on storage.objects;

create policy "docs: anyone upload" on storage.objects for insert to public
  with check (bucket_id = 'admission-documents');
create policy "docs: admin read"    on storage.objects for select to authenticated
  using (bucket_id = 'admission-documents' and public.is_admin());
create policy "docs: admin update"  on storage.objects for update to authenticated
  using (bucket_id = 'admission-documents' and public.is_admin())
  with check (bucket_id = 'admission-documents' and public.is_admin());
create policy "docs: admin delete"  on storage.objects for delete to authenticated
  using (bucket_id = 'admission-documents' and public.is_admin());

-- ============================================================================
-- NOTES
-- · File type/size validation is enforced in the frontend (PDF/JPG/PNG ≤ 5 MB).
--   For stricter control, add a CHECK on the object name/metadata or an edge
--   function later.
-- · Applicants can only upload; they can never list or read documents —
--   not even their own — which prevents enumeration of other people's files.
-- ============================================================================

/* ============================ PART 4/4 : SAMPLE CONTENT ==================== */

-- ============================================================================
-- BAHRIA NAVY SCHOOL PORTAL · 04 — SEED DATA (OPTIONAL, DEMO-READY)
-- Run AFTER 01 + 02 + 03.
-- ⚠ ALL rows below are clearly-labelled SAMPLE placeholders so the website
--   looks complete during the presentation. Replace them with approved school
--   content from the Admin Dashboard — never present sample data as official.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- site_settings defaults
-- ---------------------------------------------------------------------------
insert into public.site_settings (key, value) values
  ('site.name', 'Bahria College'),
  ('site.tagline', 'Learn • Lead • Serve'),
  ('hero.kicker', 'Welcome to Our School'),
  ('hero.title', 'Discover your
next horizon.'),
  ('hero.subtitle', 'A supportive learning community built on knowledge, character and confidence.'),
  ('home.welcome_title', 'Learning with purpose & discipline.'),
  ('home.welcome_text', 'Our school brings together academic learning, character development and a spirit of service. Students are encouraged to think clearly, act responsibly and grow with confidence — in the classroom, on the sports field and in the community. (Sample introduction — replace it any time from Admin → Website Content.)'),
  ('home.principal_message', 'We believe every child carries a horizon worth reaching. Our teachers work beside each student to build knowledge, discipline and confidence — qualities that will serve them for life. (Sample message — replace with the approved principal''s message.)'),
  ('home.principal_name', 'Principal''s Name'),
  ('home.principal_title', 'Principal, Bahria College'),
  ('home.mission', 'Inspiring learners to think clearly, act responsibly and serve with confidence.'),
  ('home.vision', 'A generation of disciplined, confident learners ready to serve their communities and their country.'),
  ('home.values', E'Integrity: We do the right thing, even when no one is watching.\nDiscipline: Order and consistency turn effort into achievement.\nExcellence: We hold our work to the highest standard.\nService: We lead by serving our school and our community.'),
  ('home.facilities', E'Science Laboratories: Fully equipped physics, chemistry and biology laboratories.\nComputer Lab: Modern computing and digital learning resources.\nLibrary: A quiet reading room with a growing catalogue of books.\nSports Grounds: Grounds and coaching for cricket, football and athletics.'),
  ('home.stats', E'Students: 1200\nFaculty Members: 65\nYears of Excellence: 25\nBoard Result: 98'),
  ('about.history_title', 'Shaping character. Strengthening futures.'),
  ('about.history_text', 'Our school was established to provide quality education rooted in discipline and character. Over the years it has grown into a thriving learning community. (Sample text — replace with the school''s approved history and establishment year.)'),
  ('admission.intro', 'Apply online in five simple steps. Fill in the student and guardian details, provide previous academic history, upload the required documents and submit. You will receive a unique reference number to track your application.'),
  ('admission.requirements', E'Keep scanned copies of the required documents ready (PDF or JPG, up to 5 MB each)\nCheck that names and dates match the official documents exactly\nReview the full application before final submission\nSave your application reference number after submitting'),
  ('admission.fee_note', 'Actual application fields, required documents and fee information must be approved by the school administration before going live.'),
  ('contact.address', 'School address goes here — update from Admin → Website Content.'),
  ('contact.phone', '+92 21 0000 0000'),
  ('contact.email', 'info@school.example'),
  ('contact.hours', 'Monday – Saturday, 8:00 AM – 2:00 PM'),
  ('contact.map_embed', ''),
  ('social.facebook', ''),
  ('social.youtube', '')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- academic years (one active)
-- ---------------------------------------------------------------------------
insert into public.academic_years (label, is_active) values
  ('2026-2027', true),
  ('2025-2026', false)
on conflict (label) do nothing;

-- ---------------------------------------------------------------------------
-- classes
-- ---------------------------------------------------------------------------
insert into public.classes (name, level, description, display_order, is_active) values
  ('Class 1', 1, 'Primary level foundation year.', 1, true),
  ('Class 2', 2, 'Primary level.', 2, true),
  ('Class 3', 3, 'Primary level.', 3, true),
  ('Class 4', 4, 'Primary level.', 4, true),
  ('Class 5', 5, 'Primary level.', 5, true),
  ('Class 6', 6, 'Middle level.', 6, true),
  ('Class 7', 7, 'Middle level.', 7, true),
  ('Class 8', 8, 'Middle level.', 8, true),
  ('Class 9', 9, 'Secondary level — board examination preparation.', 9, true),
  ('Class 10', 10, 'Secondary level — board examination year.', 10, true)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- SAMPLE notices (incl. one urgent banner)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from public.notices) then
    insert into public.notices (title, body, category, is_emergency, pinned, status, publish_at, expires_at) values
      ('Early school closure (Sample)',
       'Sample notice: the school will close early today at 11:30 AM due to administrative reasons. Parents are requested to pick up their children on time. This urgent banner disappears automatically at expiry.',
       'urgent', true, false, 'published', now(), now() + interval '3 days'),
      ('Winter holiday announcement (Sample)',
       'Sample notice: the school will remain closed for the winter holiday as per the announced academic calendar. Classes resume on the date announced by the administration.',
       'holiday', false, false, 'published', now(), now() + interval '60 days'),
      ('Admissions open for the new academic year (Sample)',
       'Sample notice: online admissions are open for the upcoming academic year. Apply through the Online Admission portal on this website and keep scanned documents ready.',
       'admission', false, true, 'published', now(), null);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- SAMPLE events
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from public.events) then
    insert into public.events (title, description, event_date, location, category, cover_url, status) values
      ('Annual Sports Day (Sample)',
       'Sample event: athletics, house competitions and prize distribution ceremony. Parents are invited; gates open at 8:00 AM.',
       current_date + 40, 'Main Ground', 'sports', '/placeholders/event-1.svg', 'published'),
      ('Prize Distribution Ceremony (Sample)',
       'Sample event: recognition of position holders, competition winners and scholarship recipients.',
       current_date + 75, 'Main Hall', 'ceremony', '/placeholders/event-2.svg', 'published'),
      ('Science & Art Exhibition (Sample)',
       'Sample event: student projects from science, robotics and art clubs on public display.',
       current_date - 30, 'Science Block', 'academic', '/placeholders/campus-3.svg', 'published');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- SAMPLE gallery items (local placeholder images)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from public.gallery_items) then
    insert into public.gallery_items (title, caption, url, type, category, status) values
      ('Main building (Sample)', 'Placeholder — replace with approved campus photo.', '/placeholders/campus-1.svg', 'image', 'campus', 'published'),
      ('Classroom activity (Sample)', 'Placeholder — replace with approved photo.', '/placeholders/campus-2.svg', 'image', 'academic', 'published'),
      ('Science fair (Sample)', 'Placeholder — replace with approved photo.', '/placeholders/campus-3.svg', 'image', 'academic', 'published'),
      ('Sports day (Sample)', 'Placeholder — replace with approved photo.', '/placeholders/event-1.svg', 'image', 'sports', 'published'),
      ('Ceremony (Sample)', 'Placeholder — replace with approved photo.', '/placeholders/event-2.svg', 'image', 'ceremony', 'published'),
      ('Campus view (Sample)', 'Placeholder — replace with approved photo.', '/placeholders/campus-4.svg', 'image', 'campus', 'published');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- SAMPLE faculty
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from public.faculty) then
    insert into public.faculty (name, designation, category, department, qualification, bio, photo_url, display_order) values
      ('Principal''s Name (Sample)', 'Principal', 'principal', 'Administration', 'M.A, M.Ed',
       'Sample profile — replace with the principal''s approved name, photograph and biography.', '/placeholders/person-1.svg', 1),
      ('Vice Principal''s Name (Sample)', 'Vice Principal', 'vice_principal', 'Administration', 'M.Sc, B.Ed',
       'Sample profile — replace with approved information.', '/placeholders/person-2.svg', 2),
      ('Teacher Name (Sample)', 'Senior Teacher — Science', 'teacher', 'Science Department', 'M.Sc Physics',
       'Sample profile — replace with approved information.', '/placeholders/person-1.svg', 10),
      ('Teacher Name (Sample)', 'Teacher — Mathematics', 'teacher', 'Mathematics Department', 'M.Sc Mathematics',
       'Sample profile — replace with approved information.', '/placeholders/person-2.svg', 11),
      ('Teacher Name (Sample)', 'Teacher — English', 'teacher', 'English Department', 'M.A English',
       'Sample profile — replace with approved information.', '/placeholders/person-1.svg', 12),
      ('Staff Name (Sample)', 'Office Administrator', 'staff', 'Front Office', 'B.Com',
       'Sample profile — replace with approved information.', '/placeholders/person-2.svg', 20);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- SAMPLE achievements
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from public.achievements) then
    insert into public.achievements (title, description, category, year, student_name, is_active) values
      ('Board Examination Distinction (Sample)', 'Sample record — replace with verified board results and positions before publishing.', 'result', extract(year from current_date)::int, 'Student Name (Sample)', true),
      ('Inter-School Debate Winner (Sample)', 'Sample record — replace with verified competition results.', 'competition', extract(year from current_date)::int, 'Student Name (Sample)', true),
      ('Merit Scholarship (Sample)', 'Sample record — replace with verified scholarship awards.', 'scholarship', extract(year from current_date)::int - 1, 'Student Name (Sample)', true),
      ('Alumni Achievement (Sample)', 'Sample record — highlight notable alumni with verified information.', 'alumni', extract(year from current_date)::int - 5, 'Alumni Name (Sample)', true);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- SAMPLE history milestones + visitors
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from public.history_items) then
    insert into public.history_items (title, description, item_type, date_label, sort_date, visitor_name, visitor_designation, image_url) values
      ('School established (Sample)', 'Sample milestone — replace with the approved establishment year and founding details.', 'milestone', '19XX', '1970-01-01', null, null, null),
      ('New academic block inaugurated (Sample)', 'Sample milestone — replace with verified campus expansion history.', 'milestone', '20XX', '2000-01-01', null, null, null),
      ('Laboratories upgraded (Sample)', 'Sample milestone — replace with verified facilities history.', 'milestone', '20XX', '2010-01-01', null, null, null),
      ('Distinguished Naval official''s visit (Sample)', 'Sample visit — publish visitor name, designation and photograph only after verification by the school.', 'visit', '20XX', '2015-01-01', 'Visitor Name (Sample)', 'Designation (Sample)', '/placeholders/visit-1.svg'),
      ('Annual prize distribution presided by dignitary (Sample)', 'Sample visit — replace with verified ceremony details.', 'visit', '20XX', '2018-01-01', 'Visitor Name (Sample)', 'Designation (Sample)', '/placeholders/visit-1.svg');
  end if;
end $$;

-- ============================================================================
-- DONE. Next step: create the first admin user (see README → "Create the
-- first admin") — Supabase Dashboard → Authentication → Add user, then:
--   update public.profiles set role = 'admin' where id = '<user-uuid>';
-- ============================================================================
