import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAsync } from '../../hooks/useAsync'
import { contentApi, admissionsPublicApi, storageApi } from '../../lib/api'
import { isSupabaseConfigured } from '../../lib/supabase'
import { genRef, fingerprint, isEmail, digits, ageYears, fmtDate, cn } from '../../lib/utils'
import { PageHero, ConfigNotice, Spinner } from '../../components/ui/Bits'
import { Input, Select, Textarea, FilePick } from '../../components/ui/Fields'
import { ConfirmDialog } from '../../components/ui/Modal'
import { useToast } from '../../context/ToastContext'
import Icon from '../../components/ui/icons'

/* ============================================================
   Multi-step admission application:
   1 Student → 2 Parent → 3 Academic → 4 Documents → 5 Review
   Stored in Supabase (admissions table) + private storage bucket.
   ============================================================ */

const EMPTY = {
  student_name: '',
  date_of_birth: '',
  gender: '',
  nationality: 'Pakistani',
  present_address: '',
  guardian_name: '',
  guardian_relation: 'Father',
  guardian_cnic: '',
  guardian_phone: '',
  guardian_email: '',
  guardian_occupation: '',
  class_id: '',
  academic_year_id: '',
  previous_school: '',
  last_class_passed: '',
  previous_percentage: '',
}

const DOCS = [
  { key: 'birth_certificate', label: 'Birth Certificate / B-Form', required: true },
  { key: 'photo', label: 'Recent Photograph', required: true },
  { key: 'report_card', label: 'Last Report Card', required: false },
  { key: 'cnic', label: 'Guardian CNIC Copy', required: false },
  { key: 'other', label: 'Other Supporting Document', required: false },
]

const STEP_TITLES = ['Student', 'Parent', 'Academic', 'Documents', 'Review']

export default function Apply() {
  const toast = useToast()
  const classes = useAsync(() => contentApi.classes(), [])
  const years = useAsync(() => contentApi.years(), [])

  const [step, setStep] = useState(0)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [files, setFiles] = useState({}) // key → {file, error}
  const [declaration, setDeclaration] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // {reference_no, created_at}

  const activeClasses = classes.data || []
  const activeYears = (years.data || []).filter((y) => y.is_active)
  const selectedClass = activeClasses.find((c) => c.id === form.class_id)
  const selectedYear = activeYears.find((y) => y.id === form.academic_year_id)

  useEffect(() => {
    // default the academic year once loaded
    if (!form.academic_year_id && activeYears.length === 1) {
      setForm((f) => ({ ...f, academic_year_id: activeYears[0].id }))
    }
  }, [activeYears, form.academic_year_id])

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setErrors((er) => ({ ...er, [k]: undefined }))
  }

  /* ---------- per-step validation ---------- */
  const validate = (s) => {
    const er = {}
    if (s === 0) {
      if (form.student_name.trim().length < 3) er.student_name = 'Enter the student’s full name as on official documents.'
      if (!form.date_of_birth) er.date_of_birth = 'Date of birth is required.'
      else {
        const age = ageYears(form.date_of_birth)
        if (age === null) er.date_of_birth = 'Enter a valid date.'
        else if (age < 3 || age > 19) er.date_of_birth = `Age appears to be ${age} years — expected between 3 and 19.`
      }
      if (!form.gender) er.gender = 'Select gender.'
      if (form.present_address.trim().length < 8) er.present_address = 'Enter the complete present address.'
    }
    if (s === 1) {
      if (form.guardian_name.trim().length < 3) er.guardian_name = 'Guardian’s full name is required.'
      if (digits(form.guardian_phone).length < 10) er.guardian_phone = 'Enter a valid phone number (at least 10 digits).'
      if (!/^\d{13}$/.test(digits(form.guardian_cnic))) er.guardian_cnic = 'CNIC must be 13 digits (with or without dashes).'
      if (form.guardian_email && !isEmail(form.guardian_email)) er.guardian_email = 'Enter a valid email address.'
    }
    if (s === 2) {
      if (!form.class_id) er.class_id = 'Select the class you are applying for.'
      if (!form.academic_year_id) er.academic_year_id = 'Select the academic year.'
      if (form.previous_school.trim().length < 2) er.previous_school = 'Previous school name is required (write “None” if first admission).'
      if (form.previous_percentage && (isNaN(form.previous_percentage) || form.previous_percentage < 0 || form.previous_percentage > 100))
        er.previous_percentage = 'Enter a percentage between 0 and 100.'
    }
    if (s === 3) {
      for (const d of DOCS) {
        if (d.required && !files[d.key]?.file) er[d.key] = 'This document is required.'
      }
    }
    if (s === 4) {
      if (!declaration) er.declaration = 'Please accept the declaration to submit.'
    }
    setErrors(er)
    return Object.keys(er).length === 0
  }

  const next = () => {
    if (validate(step)) setStep((s) => Math.min(s + 1, 4))
    else toast.error('Please fix the highlighted fields before continuing.')
  }
  const back = () => setStep((s) => Math.max(s - 1, 0))

  /* ---------- submit ---------- */
  const submit = async () => {
    if (!validate(4)) {
      toast.error('Please accept the declaration first.')
      return
    }
    setConfirming(false)
    setBusy(true)
    try {
      const reference_no = genRef()
      const docs = []
      for (const d of DOCS) {
        const f = files[d.key]?.file
        if (!f) continue
        const meta = await storageApi.uploadDocument(reference_no, d.label, f)
        docs.push(meta)
      }
      const payload = {
        reference_no,
        submission_fingerprint: fingerprint({
          n: form.student_name, d: form.date_of_birth, p: digits(form.guardian_phone).slice(-6), c: form.class_id, y: form.academic_year_id,
        }),
        ...form,
        guardian_cnic: digits(form.guardian_cnic),
        previous_percentage: form.previous_percentage === '' ? null : Number(form.previous_percentage),
        documents: docs,
        status: 'pending',
      }
      const res = await admissionsPublicApi.create(payload)
      setResult(res)
      window.scrollTo(0, 0)
    } catch (err) {
      if (err.code === 'DUPLICATE_SUBMISSION' || /duplicate key/i.test(err.message)) {
        toast.error('An application with these exact details already exists. Use “Track Application” with your reference number instead of submitting again.')
      } else {
        toast.error(err.message || 'Submission failed. Please check your connection and try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  /* ---------- success screen ---------- */
  if (result) return <SuccessScreen result={result} form={form} selectedClass={selectedClass} selectedYear={selectedYear} />

  if (!isSupabaseConfigured) {
    return (
      <div className="bg-navy-section min-h-screen pb-20 pt-40">
        <div className="container-x max-w-3xl">
          <h1 className="h-display mb-8 text-3xl font-bold text-white">Online Admission</h1>
          <ConfigNotice />
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHero
        kicker="Admissions"
        title="Apply Online"
        text="Complete each step carefully — names and dates must match official documents exactly."
      />

      <section className="bg-cream/60 py-14">
        <div className="container-x max-w-4xl">
          {/* progress */}
          <div className="mb-10 flex items-start">
            {STEP_TITLES.map((t, i) => (
              <div key={t} className={cn('flex-1', i === 0 ? '' : 'hidden sm:block')}>
                <div className="flex items-center">
                  <div className={cn('flex flex-col items-center gap-2', i > 0 && 'sm:w-full')}>
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black transition-all',
                        i < step ? 'border-gold-500 bg-gold-500 text-navy-950' : i === step ? 'border-gold-500 bg-navy-900 text-gold-300' : 'border-navy-200 bg-white text-slate-400'
                      )}
                    >
                      {i < step ? <Icon name="check" size={15} /> : i + 1}
                    </span>
                    <span className={cn('text-[10px] font-black uppercase tracking-widest', i <= step ? 'text-gold-600' : 'text-slate-400', i === 0 && 'sm:hidden')}>
                      {t}
                    </span>
                  </div>
                  {i < 4 ? <span className={cn('mx-1 h-0.5 flex-1 rounded', i < step ? 'bg-gold-500' : 'bg-navy-200')} /> : null}
                </div>
              </div>
            ))}
          </div>

          <div className="card p-6 md:p-10">
            {/* STEP 1 — student */}
            {step === 0 ? (
              <div>
                <StepTitle t="Student Information" d="Enter the applicant's details as shown on official documents." />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="Student full name" required value={form.student_name} onChange={set('student_name')} error={errors.student_name} placeholder="e.g. Ayesha Ahmed" className="sm:col-span-2" />
                  <Input label="Date of birth" required type="date" value={form.date_of_birth} onChange={set('date_of_birth')} error={errors.date_of_birth} max={new Date().toISOString().slice(0, 10)} />
                  <Select label="Gender" required value={form.gender} onChange={set('gender')} error={errors.gender}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </Select>
                  <Input label="Nationality" value={form.nationality} onChange={set('nationality')} />
                  <Textarea label="Present address" required rows={3} value={form.present_address} onChange={set('present_address')} error={errors.present_address} placeholder="House, street, area, city" className="sm:col-span-2" />
                </div>
              </div>
            ) : null}

            {/* STEP 2 — parent */}
            {step === 1 ? (
              <div>
                <StepTitle t="Parent / Guardian Information" d="The guardian will receive all admission correspondence." />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="Guardian full name" required value={form.guardian_name} onChange={set('guardian_name')} error={errors.guardian_name} />
                  <Select label="Relation to student" value={form.guardian_relation} onChange={set('guardian_relation')}>
                    {['Father', 'Mother', 'Guardian'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </Select>
                  <Input label="CNIC number" required value={form.guardian_cnic} onChange={set('guardian_cnic')} error={errors.guardian_cnic} placeholder="13 digits, e.g. 42201-1234567-1" />
                  <Input label="Mobile number" required value={form.guardian_phone} onChange={set('guardian_phone')} error={errors.guardian_phone} placeholder="03xx-xxxxxxx" help="Used to verify your identity when tracking the application." />
                  <Input label="Email (optional)" type="email" value={form.guardian_email} onChange={set('guardian_email')} error={errors.guardian_email} placeholder="guardian@example.com" />
                  <Input label="Occupation" value={form.guardian_occupation} onChange={set('guardian_occupation')} placeholder="e.g. Engineer" />
                </div>
              </div>
            ) : null}

            {/* STEP 3 — academic */}
            {step === 2 ? (
              <div>
                <StepTitle t="Academic History" d="Applying class, year and previous school record." />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Select label="Class applying for" required value={form.class_id} onChange={set('class_id')} error={errors.class_id}>
                    <option value="">Select class</option>
                    {activeClasses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                  <Select label="Academic year" required value={form.academic_year_id} onChange={set('academic_year_id')} error={errors.academic_year_id}>
                    <option value="">Select year</option>
                    {activeYears.map((y) => (
                      <option key={y.id} value={y.id}>{y.label}</option>
                    ))}
                  </Select>
                  <Input label="Previous school" required value={form.previous_school} onChange={set('previous_school')} error={errors.previous_school} placeholder="School name (or 'None')" className="sm:col-span-2" />
                  <Input label="Last class passed" value={form.last_class_passed} onChange={set('last_class_passed')} placeholder="e.g. Class 5" />
                  <Input label="Final percentage (optional)" type="number" min="0" max="100" step="0.01" value={form.previous_percentage} onChange={set('previous_percentage')} error={errors.previous_percentage} placeholder="e.g. 85.5" />
                </div>
              </div>
            ) : null}

            {/* STEP 4 — documents */}
            {step === 3 ? (
              <div>
                <StepTitle t="Required Documents" d="Upload clear scans — PDF or JPG / PNG, up to 5 MB each." />
                <div className="grid gap-5">
                  {DOCS.map((d) => (
                    <FilePick
                      key={d.key}
                      label={d.label}
                      required={d.required}
                      file={files[d.key]?.file}
                      error={errors[d.key] || files[d.key]?.error}
                      onSelect={(file, err) => setFiles((fs) => ({ ...fs, [d.key]: { file: err ? undefined : file, error: err } }))}
                      onClear={() => setFiles((fs) => ({ ...fs, [d.key]: undefined }))}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {/* STEP 5 — review */}
            {step === 4 ? (
              <div>
                <StepTitle t="Review & Submit" d="Check every detail carefully. Use Back to correct anything." />
                <div className="grid gap-4 md:grid-cols-2">
                  <ReviewCard title="Student">
                    <Row k="Full name" v={form.student_name} />
                    <Row k="Date of birth" v={fmtDate(form.date_of_birth)} />
                    <Row k="Gender" v={form.gender} />
                    <Row k="Nationality" v={form.nationality} />
                    <Row k="Address" v={form.present_address} />
                  </ReviewCard>
                  <ReviewCard title="Parent / Guardian">
                    <Row k="Name" v={form.guardian_name} />
                    <Row k="Relation" v={form.guardian_relation} />
                    <Row k="CNIC" v={form.guardian_cnic} />
                    <Row k="Phone" v={form.guardian_phone} />
                    <Row k="Email" v={form.guardian_email || '—'} />
                    <Row k="Occupation" v={form.guardian_occupation || '—'} />
                  </ReviewCard>
                  <ReviewCard title="Academic">
                    <Row k="Class applying" v={selectedClass?.name} />
                    <Row k="Academic year" v={selectedYear?.label} />
                    <Row k="Previous school" v={form.previous_school} />
                    <Row k="Last class passed" v={form.last_class_passed || '—'} />
                    <Row k="Percentage" v={form.previous_percentage ? `${form.previous_percentage}%` : '—'} />
                  </ReviewCard>
                  <ReviewCard title="Documents">
                    {DOCS.map((d) => (
                      <Row key={d.key} k={d.label} v={files[d.key]?.file ? files[d.key].file.name : d.required ? '⚠ Missing' : 'Not provided'} warn={!files[d.key]?.file && d.required} />
                    ))}
                  </ReviewCard>
                </div>

                <label className="mt-7 flex cursor-pointer items-start gap-3 rounded-lg border border-gold-500/40 bg-gold-100/40 p-4">
                  <input
                    type="checkbox"
                    checked={declaration}
                    onChange={(e) => {
                      setDeclaration(e.target.checked)
                      setErrors((er) => ({ ...er, declaration: undefined }))
                    }}
                    className="mt-0.5 h-4 w-4 accent-[#c9a227]"
                  />
                  <span className="text-xs leading-relaxed text-navy-900">
                    I declare that the information provided is correct to the best of my knowledge, and I understand that
                    giving false information may result in the cancellation of admission. I agree to the school's admission
                    process and confirm the uploaded documents are authentic.
                  </span>
                </label>
                {errors.declaration ? <div className="err-text">{errors.declaration}</div> : null}
              </div>
            ) : null}

            {/* nav */}
            <div className="mt-9 flex items-center justify-between border-t border-navy-100 pt-6">
              <button className="btn btn-ghost" onClick={back} disabled={step === 0 || busy}>
                <Icon name="chevronLeft" size={15} /> Back
              </button>
              {step < 4 ? (
                <button className="btn btn-gold" onClick={next} disabled={busy}>
                  Save & Continue <Icon name="chevronRight" size={15} />
                </button>
              ) : (
                <button className="btn btn-gold" onClick={() => setConfirming(true)} disabled={busy}>
                  <Icon name="check" size={15} /> Submit Application
                </button>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Already applied? <Link to="/admissions/status" className="font-bold text-gold-600 hover:underline">Track your application status →</Link>
          </p>
        </div>
      </section>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={submit}
        busy={busy}
        danger={false}
        title="Submit application?"
        confirmLabel="Submit now"
        body="After submission you will receive a unique reference number. Keep it safe — it is required to track your application and download the receipt. Details cannot be edited after submission; the school may request corrections if needed."
      />

      {busy ? (
        <div className="fixed inset-0 z-[180] flex flex-col items-center justify-center bg-navy-950/85 backdrop-blur-sm">
          <Spinner light size={40} label={step === 4 ? 'Uploading documents & submitting…' : 'Working…'} />
        </div>
      ) : null}
    </>
  )
}

/* ---------- helpers ---------- */

function StepTitle({ t, d }) {
  return (
    <div className="mb-7">
      <h2 className="h-display text-2xl font-bold text-navy-900">{t}</h2>
      <div className="gold-line mt-3" />
      <p className="mt-2 text-sm text-slate-500">{d}</p>
    </div>
  )
}

function ReviewCard({ title, children }) {
  return (
    <div className="rounded-lg border border-navy-100 bg-navy-50/40 p-5">
      <div className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-gold-600">{title}</div>
      <dl className="space-y-2">{children}</dl>
    </div>
  )
}

function Row({ k, v, warn }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <dt className="shrink-0 font-semibold text-slate-400">{k}</dt>
      <dd className={cn('text-right font-bold', warn ? 'text-red-500' : 'text-navy-900')}>{v}</dd>
    </div>
  )
}

/* ---------- success + printable receipt ---------- */

function SuccessScreen({ result, form, selectedClass, selectedYear }) {
  const ref = result.reference_no
  return (
    <section className="bg-navy-section min-h-screen py-20">
      <div className="container-x max-w-3xl">
        <div className="no-print mb-8 text-center">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-green-400/60 bg-green-500/15 text-4xl text-green-400">✓</span>
          <h1 className="h-display mt-6 text-3xl font-bold text-white md:text-4xl">Application submitted successfully</h1>
          <p className="mt-3 text-sm leading-relaxed text-navy-300">
            Save your reference number now — you will need it (with the guardian phone number) to track your application
            and print the receipt.
          </p>
        </div>

        {/* printable receipt */}
        <div className="print-area card overflow-hidden">
          <div className="flex items-center justify-between border-b-2 border-gold-500 bg-navy-950 px-7 py-5">
            <div className="flex items-center gap-3">
              <img src="/logos/bahria-crest.png" alt="" className="h-12 w-12 object-contain" />
              <div>
                <div className="h-display text-lg font-bold text-white">Bahria College</div>
                <div className="text-[9px] font-bold uppercase tracking-[0.28em] text-gold-400">Online Admission Receipt</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-navy-300">Reference No.</div>
              <div className="h-display text-xl font-bold tracking-wide text-gold-300">{ref}</div>
            </div>
          </div>
          <div className="grid gap-x-8 gap-y-3 px-7 py-6 text-sm sm:grid-cols-2">
            <ReceiptRow k="Student name" v={form.student_name} />
            <ReceiptRow k="Date of birth" v={fmtDate(form.date_of_birth)} />
            <ReceiptRow k="Guardian" v={`${form.guardian_name} (${form.guardian_relation})`} />
            <ReceiptRow k="Phone" v={form.guardian_phone} />
            <ReceiptRow k="Class applying" v={selectedClass?.name || '—'} />
            <ReceiptRow k="Academic year" v={selectedYear?.label || '—'} />
            <ReceiptRow k="Previous school" v={form.previous_school} />
            <ReceiptRow k="Submitted on" v={fmtDate(result.created_at)} />
          </div>
          <div className="border-t border-dashed border-slate-200 px-7 py-4 text-[11px] leading-relaxed text-slate-500">
            Status: <b className="text-navy-900">Pending review</b> · The school office will review this application and
            update its status. Track it any time at <b>Track Application</b> using this reference number and the guardian
            phone number ending in {digits(form.guardian_phone).slice(-4)}.
          </div>
        </div>

        <div className="no-print mt-8 flex flex-wrap justify-center gap-4">
          <button className="btn btn-gold px-8 py-4" onClick={() => window.print()}>
            <Icon name="print" size={16} /> Print Receipt
          </button>
          <Link to="/admissions/status" className="btn btn-outline px-8 py-4">
            Track Application
          </Link>
          <Link to="/" className="btn btn-outline px-8 py-4">
            Back to Website
          </Link>
        </div>
      </div>
    </section>
  )
}

function ReceiptRow({ k, v }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dotted border-slate-200 pb-1.5">
      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{k}</span>
      <span className="text-right font-bold text-navy-900">{v}</span>
    </div>
  )
}
