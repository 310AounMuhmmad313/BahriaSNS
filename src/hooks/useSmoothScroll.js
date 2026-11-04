import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { reducedMotion } from '../lib/utils'

/**
 * Lenis smooth scrolling, wired into GSAP's ticker so ScrollTrigger
 * stays perfectly in sync. Automatically disabled when the visitor
 * prefers reduced motion. Mounted once inside PublicLayout.
 */
export function useSmoothScroll(enabled = true) {
  const lenisRef = useRef(null)

  useEffect(() => {
    if (!enabled || reducedMotion()) return undefined
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true })
    lenisRef.current = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time) => {
      try {
        lenis.raf(time * 1000)
      } catch (e) {
        /* never let lenis break the GSAP ticker */
      }
    }
    const tickId = gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [enabled])

  return lenisRef
}

/** Scroll parallax for images / decorative layers. */
export function useParallax(ref, { y = 70, scrub = true } = {}) {
  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion()) return undefined
    const ctx = gsap.context(() => {
      gsap.to(el, {
        y,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub },
      })
    }, el)
    return () => ctx.revert()
  }, [ref, y, scrub])
}
