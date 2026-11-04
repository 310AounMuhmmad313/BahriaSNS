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
