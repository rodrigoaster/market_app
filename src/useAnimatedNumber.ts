import { useEffect, useRef, useState } from 'react'

// Anima a transição de um número até o valor alvo (efeito "count up").
// Respeita prefers-reduced-motion: nesse caso, vai direto ao valor.
export function useAnimatedNumber(target: number, duration = 450): number {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)
  const rafRef = useRef<number | undefined>(undefined)
  const settleRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduz) {
      setValue(target)
      fromRef.current = target
      return
    }

    const from = fromRef.current
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min(Math.max((now - start) / duration, 0), 1)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setValue(from + (target - from) * eased)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    // Rede de segurança: garante o valor final mesmo se o rAF não completar.
    settleRef.current = window.setTimeout(() => {
      setValue(target)
      fromRef.current = target
    }, duration + 60)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (settleRef.current) clearTimeout(settleRef.current)
      fromRef.current = target
    }
  }, [target, duration])

  return value
}
