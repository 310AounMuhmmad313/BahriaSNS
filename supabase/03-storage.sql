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
