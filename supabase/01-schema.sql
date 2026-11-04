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
