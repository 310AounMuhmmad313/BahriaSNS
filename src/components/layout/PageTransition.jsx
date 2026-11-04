import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap } from '../../lib/gsap'
import { reducedMotion } from '../../lib/utils'

/**
 * Cinematic curtain sweep between public routes.
 * · The curtain is hidden by default and fully managed by GSAP
 *   (no CSS transforms anywhere — GSAP bakes existing CSS transforms
 *   into its own matrix, which would cancel the animation).
 * · First paint shows the page directly; the curtain only plays on
 *   client-side route changes.
 */
export function PageTransition({ children }) {
  const { pathname } = useLocation()
  const ref = useRef(null)
  const sweep = useRef(null)
  const first = useRef(true)

  useEffect(() => {
    window.scrollTo(0, 0)
    if (first.current || reducedMotion()) {
      first.current = false
      if (sweep.current) sweep.current.style.visibility = 'hidden'
      gsap.set(ref.current, { autoAlpha: 1, y: 0 })
      return undefined
    }

    const el = sweep.current
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(el, { visibility: 'hidden', xPercent: -100 })
      },
    })
    tl.set(el, { visibility: 'visible', xPercent: -100 })
      .fromTo(el, { xPercent: -100 }, { xPercent: 0, duration: 0.4, ease: 'power3.in' }, 0)
      .fromTo(ref.current, { autoAlpha: 0.4, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.26)
      .to(el, { xPercent: 100, duration: 0.48, ease: 'power3.inOut' }, 0.5)

    return () => tl.kill()
  }, [pathname])

  return (
    <>
      <div
        ref={sweep}
        className="pointer-events-none fixed inset-y-0 left-0 z-[120] bg-navy-950 no-print"
        style={{ width: '100vw', visibility: 'hidden' }}
        aria-hidden="true"
      >
        <div className="absolute right-0 top-0 h-full w-1.5 bg-gradient-to-b from-gold-300 to-gold-600" />
      </div>
      <div ref={ref} key={pathname}>
        {children}
      </div>
    </>
  )
}
