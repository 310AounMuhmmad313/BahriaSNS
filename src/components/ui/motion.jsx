import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/gsap'
import { reducedMotion } from '../../lib/utils'

/* ============================================================
   Shared GSAP motion components — scroll reveals, animated
   headlines, counters, 3D tilt. All respect reduced motion.
   ============================================================ */

export function Reveal({ children, y = 30, delay = 0, duration = 0.9, className = '', start = 'top 87%' }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (reducedMotion()) return undefined
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y },
        { autoAlpha: 1, y: 0, duration, delay, ease: 'power3.out', scrollTrigger: { trigger: el, start, once: true } }
      )
    }, el)
    return () => ctx.revert()
  }, [y, delay, duration, start])
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

/** Staggered reveal of direct [data-stagger] children. */
export function RevealGroup({ children, className = '', stagger = 0.1, y = 34 }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const targets = el.querySelectorAll('[data-stagger]')
    if (reducedMotion() || !targets.length) return undefined
    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { autoAlpha: 0, y },
        { autoAlpha: 1, y: 0, duration: 0.85, ease: 'power3.out', stagger, scrollTrigger: { trigger: el, start: 'top 86%', once: true } }
      )
    }, el)
    return () => ctx.revert()
  }, [stagger, y])
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

/** Word-by-word masked headline reveal (splits text on \n and spaces). */
export function AnimatedHeadline({ text, className = '', delay = 0.2, once = true }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (reducedMotion()) return undefined
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll('.hl-word'),
        { yPercent: 118 },
        { yPercent: 0, duration: 1.05, ease: 'power4.out', stagger: 0.09, delay }
      )
    }, el)
    return () => ctx.revert()
  }, [text, delay])
  const lines = String(text || '').split('\n')
  return (
    <h1 ref={ref} className={className}>
      {lines.map((line, li) => (
        <span className="hl-line" key={li}>
          {line.split(' ').map((w, wi) => (
            <span key={wi}>
              <span className="hl-word">{w}</span>{' '}
            </span>
          ))}
        </span>
      ))}
    </h1>
  )
}

/** Number that counts up when scrolled into view. */
export function StatCounter({ value, suffix = '', label, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const num = parseFloat(String(value).replace(/[^\d.]/g, '')) || 0
    if (reducedMotion()) {
      el.textContent = num.toLocaleString() + suffix
      return undefined
    }
    const ctx = gsap.context(() => {
      const obj = { v: 0 }
      gsap.to(obj, {
        v: num,
        duration: 1.9,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: () => {
          el.textContent = Math.round(obj.v).toLocaleString() + suffix
        },
      })
    }, el)
    return () => ctx.revert()
  }, [value, suffix])
  return (
    <div className={className}>
      <div ref={ref} className="h-display text-4xl font-bold text-gold-400 md:text-5xl">
        0{suffix}
      </div>
      {label ? <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.22em] text-navy-300">{label}</div> : null}
    </div>
  )
}

/** Subtle 3D tilt card (desktop pointers only). */
export function TiltCard({ children, className = '', max = 8 }) {
  const ref = useRef(null)
  const onMove = (e) => {
    const el = ref.current
    if (!el || reducedMotion() || e.pointerType === 'touch') return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    gsap.to(el, { rotateY: px * max, rotateX: -py * max, transformPerspective: 900, duration: 0.4, ease: 'power2.out' })
  }
  const onLeave = () => {
    if (ref.current) gsap.to(ref.current, { rotateX: 0, rotateY: 0, duration: 0.7, ease: 'power3.out' })
  }
  return (
    <div style={{ perspective: '1000px' }} className={className}>
      <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ transformStyle: 'preserve-3d' }} className="h-full">
        {children}
      </div>
    </div>
  )
}
