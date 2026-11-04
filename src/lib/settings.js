/**
 * Editable website content lives in the `site_settings` table.
 * These defaults are used until an admin saves a value
 * (Admin → Website Content) — no code changes needed.
 */

export const SETTING_GROUPS = [
  {
    group: 'General',
    keys: ['site.name', 'site.tagline'],
  },
  {
    group: 'Homepage',
    keys: [
      'hero.kicker', 'hero.title', 'hero.subtitle',
      'home.welcome_title', 'home.welcome_text',
      'home.principal_message', 'home.principal_name', 'home.principal_title',
      'home.mission', 'home.vision', 'home.values', 'home.facilities', 'home.stats',
    ],
  },
  {
    group: 'About Us',
    keys: ['about.history_title', 'about.history_text'],
  },
  {
    group: 'Admissions',
    keys: ['admission.intro', 'admission.requirements', 'admission.fee_note'],
  },
  {
    group: 'Contact & Social',
    keys: ['contact.address', 'contact.phone', 'contact.email', 'contact.hours', 'contact.map_embed', 'social.facebook', 'social.youtube'],
  },
]

export const FIELD_META = {
  'site.name': { label: 'School name' },
  'site.tagline': { label: 'Tagline' },
  'hero.kicker': { label: 'Hero small heading' },
  'hero.title': { label: 'Hero main heading', multiline: true, help: 'Use a new line for each line of the headline.' },
  'hero.subtitle': { label: 'Hero subtitle', multiline: true },
  'home.welcome_title': { label: 'Welcome section title' },
  'home.welcome_text': { label: 'Welcome / introduction text', multiline: true },
  'home.principal_message': { label: "Principal's message", multiline: true },
  'home.principal_name': { label: "Principal's name" },
  'home.principal_title': { label: "Principal's designation" },
  'home.mission': { label: 'Mission statement', multiline: true },
  'home.vision': { label: 'Vision statement', multiline: true },
  'home.values': { label: 'Core values', multiline: true, help: 'One per line as  Title: description' },
  'home.facilities': { label: 'Campus facilities', multiline: true, help: 'One per line as  Title: description' },
  'home.stats': { label: 'Key statistics', multiline: true, help: 'One per line as  Label: number' },
  'about.history_title': { label: 'About section title' },
  'about.history_text': { label: 'School history / about text', multiline: true },
  'admission.intro': { label: 'Admission portal introduction', multiline: true },
  'admission.requirements': { label: 'Requirements checklist', multiline: true, help: 'One item per line' },
  'admission.fee_note': { label: 'Fee / document note', multiline: true },
  'contact.address': { label: 'Official address' },
  'contact.phone': { label: 'Official phone' },
  'contact.email': { label: 'Official email' },
  'contact.hours': { label: 'Office hours' },
  'contact.map_embed': { label: 'Google Maps embed URL', help: 'From Google Maps → Share → Embed a map → copy the src URL only' },
  'social.facebook': { label: 'Facebook URL' },
  'social.youtube': { label: 'YouTube URL' },
}

export const DEFAULT_SETTINGS = {
  'site.name': 'Bahria College',
  'site.tagline': 'Learn • Lead • Serve',
  'hero.kicker': 'Welcome to Our School',
  'hero.title': 'Discover your\nnext horizon.',
  'hero.subtitle':
    'A supportive learning community built on knowledge, character and confidence.',
  'home.welcome_title': 'Learning with purpose & discipline.',
  'home.welcome_text':
    'Our school brings together academic learning, character development and a spirit of service. Students are encouraged to think clearly, act responsibly and grow with confidence — in the classroom, on the sports field and in the community. (Sample introduction — replace it any time from Admin → Website Content.)',
  'home.principal_message':
    'We believe every child carries a horizon worth reaching. Our teachers work beside each student to build knowledge, discipline and confidence — qualities that will serve them for life. (Sample message — replace with the approved principal’s message.)',
  'home.principal_name': 'Principal’s Name',
  'home.principal_title': 'Principal, Bahria College',
  'home.mission': 'Inspiring learners to think clearly, act responsibly and serve with confidence.',
  'home.vision': 'A generation of disciplined, confident learners ready to serve their communities and their country.',
  'home.values':
    'Integrity: We do the right thing, even when no one is watching.\nDiscipline: Order and consistency turn effort into achievement.\nExcellence: We hold our work to the highest standard.\nService: We lead by serving our school and our community.',
  'home.facilities':
    'Science Laboratories: Fully equipped physics, chemistry and biology laboratories.\nComputer Lab: Modern computing and digital learning resources.\nLibrary: A quiet reading room with a growing catalogue of books.\nSports Grounds: Grounds and coaching for cricket, football and athletics.',
  'home.stats': 'Students: 1200\nFaculty Members: 65\nYears of Excellence: 25\nBoard Result: 98',
  'about.history_title': 'Shaping character. Strengthening futures.',
  'about.history_text':
    'Our school was established to provide quality education rooted in discipline and character. Over the years it has grown into a thriving learning community. (Sample text — replace with the school’s approved history and establishment year.)',
  'admission.intro':
    'Apply online in five simple steps. Fill in the student and guardian details, provide previous academic history, upload the required documents and submit. You will receive a unique reference number to track your application.',
  'admission.requirements':
    'Keep scanned copies of the required documents ready (PDF or JPG, up to 5 MB each)\nCheck that names and dates match the official documents exactly\nReview the full application before final submission\nSave your application reference number after submitting',
  'admission.fee_note':
    'Actual application fields, required documents and fee information must be approved by the school administration before going live.',
  'contact.address': 'School address goes here — update from Admin → Website Content.',
  'contact.phone': '+92 21 0000 0000',
  'contact.email': 'info@school.example',
  'contact.hours': 'Monday – Saturday, 8:00 AM – 2:00 PM',
  'contact.map_embed': '',
  'social.facebook': '',
  'social.youtube': '',
}

export function getSetting(map, key) {
  const v = map?.[key]
  return v === undefined || v === null || v === '' ? DEFAULT_SETTINGS[key] ?? '' : v
}
