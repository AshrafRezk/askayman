import { useEffect } from 'react'

type Kind = 'light' | 'medium' | 'success'

const patterns: Record<Kind, number | number[]> = {
  light: 8,
  medium: 18,
  success: [12, 32, 18],
}

export function haptic(kind: Kind = 'light') {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
    navigator.vibrate(patterns[kind])
  } catch {
    // Vibration is unavailable on some desktop and iOS browsers.
  }
}

export function useSiteHaptics() {
  useEffect(() => {
    const onDown = (event: PointerEvent) => {
      const el = (event.target as HTMLElement | null)?.closest(
        'a, button, input, select, textarea, .leaflet-marker-icon, .leaflet-control-zoom-in, .leaflet-control-zoom-out',
      )
      if (!el) return
      const isPrimary = el.matches('.btn-gold, .fab, [type="submit"]')
      haptic(isPrimary ? 'medium' : 'light')
    }
    document.addEventListener('pointerdown', onDown, { passive: true })
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])
}
