import { useState } from 'react'
import { admissionsPublicApi } from '../../lib/api'
import { fmtDate, fmtDateTime, STATUS_LABEL, statusClass, cn } from '../../lib/utils'
import { PageHero } from '../../components/ui/Bits'
import { Input } from '../../components/ui/Fields'
import Icon from '../../components/ui/icons'

/**
 * Application status tracking.
 * Privacy: an application can only be viewed by combining the exact
 * reference number with the guardian's phone number — verification
 * happens inside a secure Postgres RPC, not in the browser.
 */
export default function TrackStatus() {
  const [ref, setRef] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [app, setApp] = useState(null)
  const [history, setHistory] = useState([])

  const search = async (e) => {
    e.preventDefault()
    setError('')
    if (!ref.trim() || !phone.trim()) {
      setError('Enter both the reference number and the guardian phone number.')
      return
    }
    setBusy(true)
    try {
      const [a, h] = await Promise.all([
        admissionsPublicApi.track(ref.trim().toUpperCase(), phone.trim()),
        admissionsPublicApi.trackHistory(ref.trim().toUpperCase(), phone.trim()),
      ])
      if (!a) {
        setApp(null)
        setHistory([])
        setError('No application found for this reference number and phone number combination. Check both values and try again.')
        return
      }
      setApp(a)
      setHistory(h || [])
    } catch (err) {
      if (/not configured/i.test(err.message)) setError(err.message)
      else setError('Lookup failed. Please check your connection and try again.')
      setApp(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHero
        kicker="Application status"
        title="Track Your Application"
        text="Enter your application reference number and the guardian phone number you submitted with the form."
      />

      <section className="bg-cream/60 py-14">
        <div className="container-x max-w-3xl">
          <form onSubmit={search} className="card mb-8 grid gap-4 p-7 sm:grid-cols-[1.1fr_1fr_auto] sm:items-end">
            <Input
              label="Reference number"
              required
              value={ref}
              onChange={(e) => setRef(e.target.value.toUpperCase())}
              placeholder="BA-26-XXXXXX"
            />
            <Input
              label="Guardian phone"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Number used in the form"
            />
            <button className="btn btn-gold h-[42px] px-7" disabled={busy}>
              {busy ? 'Checking…' : 'Track'}
            </button>
          </form>

          {error ? (
            <div className="mb-8 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-800">{error}</div>
          ) : null}

          {app ? (
            <div className="print-area space-y-6">
              {/* status card */}
              <div className="card overflow-hidden">
                <div className="flex items-center justify-between border-b-2 border-gold-500 bg-navy-950 px-7 py-5">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-navy-300">Application</div>
                    <div className="h-display text-xl font-bold tracking-wide text-white">{app.ref_no}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-navy-300">Status</div>
                    <div className="mt-1">{statusClass(app.status) ? <span className={statusClass(app.status)}>{STATUS_LABEL[app.status] || app.status}</span> : null}</div>
                  </div>
                </div>
                <div className="grid gap-x-8 gap-y-3 px-7 py-6 text-sm sm:grid-cols-2">
                  <KRow k="Student" v={app.student_name} />
                  <KRow k="Class" v={app.class_name || '—'} />
                  <KRow k="Academic year" v={app.year_label || '—'} />
                  <KRow k="Submitted" v={fmtDate(app.submitted_at)} />
                </div>
                {app.remarks ? (
                  <div className="mx-7 mb-6 rounded-lg border border-gold-300 bg-gold-100/50 px-4 py-3 text-xs leading-relaxed text-navy-900">
                    <b>Remarks from the school office:</b> {app.remarks}
                  </div>
                ) : null}
              </div>

              {/* history timeline */}
              {history.length ? (
                <div className="card p-7">
                  <h3 className="mb-5 text-xs font-black uppercase tracking-[0.22em] text-gold-600">Status history</h3>
                  <ol className="relative space-y-6 border-l border-navy-200 pl-6">
                    {history.map((h, i) => (
                      <li key={i} className="relative">
                        <span
                          className={cn(
                            'absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white',
                            i === history.length - 1 ? 'bg-gold-500' : 'bg-navy-300'
                          )}
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={statusClass(h.status)}>{STATUS_LABEL[h.status] || h.status}</span>
                          <span className="text-[11px] font-semibold text-slate-400">{fmtDateTime(h.changed_at)}</span>
                        </div>
                        {h.note ? <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{h.note}</p> : null}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              <div className="no-print flex flex-wrap gap-3">
                <button className="btn btn-gold" onClick={() => window.print()}>
                  <Icon name="print" size={15} /> Print status
                </button>
                <a href="/admissions/apply" className="btn btn-ghost">New application</a>
              </div>
            </div>
          ) : null}

          {!app && !error ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
              <Icon name="doc" size={34} className="mx-auto text-gold-600" />
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-500">
                Your reference number was shown after submission and is printed on your receipt
                (format <b>BA-26-XXXXXX</b>). It cannot be recovered here — contact the school office if you have lost it.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </>
  )
}

function KRow({ k, v }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dotted border-slate-200 pb-1.5">
      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{k}</span>
      <span className="text-right font-bold text-navy-900">{v}</span>
    </div>
  )
}
