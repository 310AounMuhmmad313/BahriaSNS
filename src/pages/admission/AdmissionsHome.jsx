import { Link } from 'react-router-dom'
import { useSettings } from '../../hooks/useSiteSettings'
import { Reveal, RevealGroup } from '../../components/ui/motion'
import { PageHero } from '../../components/ui/Bits'
import Icon from '../../components/ui/icons'

const STEPS = [
  ['Student', 'Applicant details as shown on official documents'],
  ['Parent', 'Guardian information and contact details'],
  ['Academic', 'Class, year and previous school history'],
  ['Documents', 'Upload scanned certificates and photographs'],
  ['Review', 'Check everything, then submit and save your reference'],
]

export default function AdmissionsHome() {
  const { get } = useSettings()
  const requirements = (get('admission.requirements') || '').split('\n').map((s) => s.trim()).filter(Boolean)

  return (
    <>
      <PageHero
        kicker="Admissions open"
        title="Online Admission Portal"
        text={get('admission.intro')}
      >
        <Reveal delay={0.25} className="mt-9 flex flex-wrap gap-4">
          <Link to="/admissions/apply" className="btn btn-gold px-8 py-4">
            Start Application <Icon name="arrowRight" size={16} />
          </Link>
          <Link to="/admissions/status" className="btn btn-outline px-8 py-4">
            Track Application
          </Link>
        </Reveal>
      </PageHero>

      {/* steps */}
      <section className="section-pad bg-white">
        <div className="container-x">
          <Reveal className="mb-12 text-center">
            <div className="kicker">Five simple steps</div>
            <h2 className="h-display mt-3 text-3xl font-bold text-navy-900 md:text-4xl">How the application works</h2>
          </Reveal>
          <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map(([t, d], i) => (
              <div key={t} data-stagger className="relative rounded-lg border border-navy-100 bg-navy-50/40 p-6 transition-all hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-lg">
                <div className="h-display text-4xl font-bold text-gold-500/80">{i + 1}</div>
                <div className="mt-3 font-bold text-navy-900">{t}</div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{d}</p>
                {i < 4 ? <span className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-navy-200 lg:block"><Icon name="chevronRight" size={18} /></span> : null}
              </div>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* before you apply */}
      <section className="bg-navy-section section-pad">
        <div className="container-x grid gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="kicker">Before you apply</div>
            <h2 className="h-display mt-3 text-3xl font-bold text-white md:text-4xl">Be prepared — it takes about 10 minutes</h2>
            <div className="gold-line mt-6" />
            <ul className="mt-7 space-y-4">
              {requirements.map((r) => (
                <li key={r} className="flex gap-3.5 text-sm leading-relaxed text-navy-200">
                  <Icon name="check" size={17} className="mt-0.5 shrink-0 text-gold-400" />
                  {r}
                </li>
              ))}
            </ul>
            {get('admission.fee_note') ? (
              <p className="mt-8 rounded-lg border border-gold-500/30 bg-gold-500/10 px-5 py-4 text-xs leading-relaxed text-gold-200">
                <b>Note:</b> {get('admission.fee_note')}
              </p>
            ) : null}
          </Reveal>

          <Reveal delay={0.15}>
            <div className="navy-card p-9">
              <h3 className="h-display text-2xl font-bold text-white">Required documents</h3>
              <p className="mt-2 text-sm text-navy-300">Scan or photograph clearly. PDF or JPG / PNG · up to 5 MB each.</p>
              <ul className="mt-6 space-y-3">
                {[
                  ['Birth Certificate / B-Form', true],
                  ['Recent passport-size photograph', true],
                  ['Last report card / school record', false],
                  ['Guardian CNIC copy', false],
                  ['Other supporting documents', false],
                ].map(([label, req]) => (
                  <li key={label} className="flex items-center gap-3 rounded border border-navy-700/60 bg-navy-900/50 px-4 py-3">
                    <Icon name="doc" size={17} className="text-gold-400" />
                    <span className="flex-1 text-sm text-navy-100">{label}</span>
                    <span className={`badge ${req ? 'badge-urgent' : 'badge-gray'}`}>{req ? 'Required' : 'Optional'}</span>
                  </li>
                ))}
              </ul>
              <Link to="/admissions/apply" className="btn btn-gold mt-8 w-full py-4">
                Start Application Now
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
