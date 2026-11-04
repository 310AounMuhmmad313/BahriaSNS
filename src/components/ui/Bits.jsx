import { useEffect } from 'react'
import { cn } from '../../lib/utils'
import { isSupabaseConfigured } from '../../lib/supabase'
import { ScrollTrigger } from '../../lib/gsap'
import { Reveal } from './motion'

/* ---------- spinner / loading ---------- */
export function Spinner({ size = 28, light = false, label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div
        className="animate-spin rounded-full"
        style={{
          width: size,
          height: size,
          border: `3px solid ${light ? 'rgba(255,255,255,.2)' : 'rgba(11,36,64,.15)'}`,
          borderTopColor: light ? '#d9b64a' : '#c9a227',
        }}
      />
      {label ? <div className={cn('text-xs font-bold uppercase tracking-[0.2em]', light ? 'text-navy-300' : 'text-slate-400')}>{label}</div> : null}
    </div>
  )
}

/* ---------- empty state ---------- */
export function EmptyState({ icon = '◈', title, text, action, dark = false }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-14 text-center', dark ? 'border-navy-700 bg-navy-900/40' : 'border-slate-200 bg-slate-50')}>
      <div className={cn('mb-3 text-3xl', dark ? 'text-gold-500' : 'text-gold-600')}>{icon}</div>
      <div className={cn('font-bold', dark ? 'text-white' : 'text-navy-900')}>{title || 'Nothing here yet'}</div>
      {text ? <div className={cn('mt-1.5 max-w-md text-sm leading-relaxed', dark ? 'text-navy-300' : 'text-slate-500')}>{text}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

/* ---------- error note ---------- */
export function ErrorNote({ error, onRetry }) {
  const notConfigured = /not configured/i.test(error?.message || '')
  if (notConfigured) return <ConfigNotice />
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
      <b>Something went wrong.</b> {error?.message || 'Please try again.'}
      {onRetry ? (
        <button className="btn btn-ghost btn-sm ml-3" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  )
}

/* ---------- supabase setup notice ---------- */
export function ConfigNotice() {
  return (
    <div className="mx-auto max-w-2xl rounded-lg border border-gold-300 bg-gold-100/60 px-6 py-6 text-sm leading-relaxed text-navy-900">
      <div className="mb-2 font-black uppercase tracking-[0.2em] text-gold-600">Setup required</div>
      <p className="mb-3">
        This application is not connected to Supabase yet. Create a <b>.env</b> file in the project root (copy{' '}
        <code className="rounded bg-navy-900 px-1.5 py-0.5 text-gold-300">.env.example</code>) and add your project credentials:
      </p>
      <pre className="mb-3 overflow-x-auto rounded bg-navy-950 p-3 text-xs leading-relaxed text-navy-200">{`VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key`}</pre>
      <p className="text-slate-600">
        Then run the SQL files from the <b>supabase/</b> folder in your Supabase SQL Editor (see README — “Connect your Supabase project”).
      </p>
    </div>
  )
}

/* ---------- async block: loading / error / empty handling ---------- */
export function AsyncBlock({ loading, error, data, isEmpty, empty, children, dark = false, onRetry }) {
  useEffect(() => {
    if (!loading) {
      // let ScrollTrigger measure content that arrived asynchronously
      const t = setTimeout(() => ScrollTrigger.refresh(), 250)
      return () => clearTimeout(t)
    }
    return undefined
  }, [loading])

  if (loading) return <Spinner light={dark} label="Loading" />
  if (error) return <ErrorNote error={error} onRetry={onRetry} />
if (isEmpty || (Array.isArray(data) && data.length === 0)) {
  return empty || <EmptyState dark={dark} />
}
  return children
}

/* ---------- section heading ---------- */
export function SectionHeading({ kicker, title, text, align = 'center', dark = false, className }) {
  return (
    <Reveal className={cn('mb-12', align === 'center' && 'text-center', className)}>
      <div className={cn('kicker', align === 'center' && 'flex items-center justify-center gap-3')}>
        {align === 'center' ? <span className="gold-line" style={{ width: 34 }} /> : null}
        {kicker}
        {align === 'center' ? <span className="gold-line" style={{ width: 34 }} /> : null}
      </div>
      <h2 className={cn('h-display mt-3 text-3xl font-bold leading-tight md:text-[2.6rem]', dark ? 'text-white' : 'text-navy-900')}>{title}</h2>
      {text ? <p className={cn('mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed', dark ? 'text-navy-300' : 'text-slate-500')}>{text}</p> : null}
    </Reveal>
  )
}

/* ---------- inner page hero ---------- */
export function PageHero({ kicker, title, text, children }) {
  return (
    <section className="bg-navy-section relative overflow-hidden pb-16 pt-40 md:pb-20 md:pt-48">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-navy-600/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-40 w-96 rounded-full bg-gold-500/10 blur-3xl" />
      <div className="container-x relative">
        <Reveal>
          <div className="kicker">{kicker}</div>
          <h1 className="h-display mt-4 max-w-3xl text-4xl font-bold leading-tight text-white md:text-6xl">{title}</h1>
          <div className="gold-line mt-6" />
          {text ? <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-navy-300">{text}</p> : null}
          {children}
        </Reveal>
      </div>
    </section>
  )
}

export { isSupabaseConfigured }
