import L from 'leaflet'
import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import parcels from '../data/partner-parcels.json'
import { drawCar, explodedRing, pointOnRoad, roadLength, type LngLat } from '../isoMassing'
import { getOsmRoads, getOsmRoadsForIds, type OsmRoadBundle } from '../osmRoads'
import { PARTNER_COMPOUNDS } from '../partners'

type ParcelFeature = {
  type: 'Feature'
  properties: {
    partnerId: string
    kind: 'compound' | 'zone' | 'outline'
    primary: boolean
  }
}

const PARCELS = parcels as { features: ParcelFeature[] }

const CAR_COLORS = [
  { body: '#1a2a3c', roof: '#f0d48a', light: '#f6f0e4' },
  { body: '#c49c4f', roof: '#2a3d52', light: '#fff6d8' },
  { body: '#f6f0e4', roof: '#1a2a3c', light: '#f0d48a' },
  { body: '#2a5a48', roof: '#9be7b0', light: '#f6f0e4' },
]

type Actor = {
  partnerId: string
  roadIndex: number
  t: number
  speed: number
  pingPong: boolean
  forward: boolean
  color: (typeof CAR_COLORS)[number]
}

function selectedIds(selected: string | null) {
  const ids = new Set<string>()
  if (!selected) return ids
  ids.add(selected)
  const compound = PARTNER_COMPOUNDS.find((item) => item.id === selected)
  if (compound?.parcelId) ids.add(compound.parcelId)
  return ids
}

function partnerIdsForLife(selected: string | null): string[] {
  if (!selected) return []
  const ids = selectedIds(selected)
  const family = PARTNER_COMPOUNDS.find((item) => item.id === selected)?.group ?? null
  const fromParcels = PARCELS.features
    .filter((feature) => {
      if (ids.has(feature.properties.partnerId)) return true
      if (family === 'taj' && feature.properties.partnerId.startsWith('taj') && feature.properties.kind === 'zone') {
        return true
      }
      return false
    })
    .map((feature) => feature.properties.partnerId)

  const unique = [...new Set(fromParcels)]
  const withRoads = unique.filter((id) => getOsmRoads(id))
  if (withRoads.length) {
    // Prefer zone/compound streets over huge outline dumps when both exist.
    const solid = withRoads.filter((id) => {
      const kind = PARCELS.features.find((f) => f.properties.partnerId === id)?.properties.kind
      return kind !== 'outline'
    })
    return solid.length ? solid : withRoads
  }

  const compound = PARTNER_COMPOUNDS.find((item) => item.id === selected)
  const target = compound?.parcelId ?? selected
  return getOsmRoads(target) ? [target] : []
}

function hash01(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967296
}

function spawnActors(bundles: OsmRoadBundle[], seed: string): Actor[] {
  const actors: Actor[] = []
  let salt = 0
  for (const bundle of bundles) {
    const ranked = [...bundle.roads]
      .map((road, roadIndex) => ({ roadIndex, len: roadLength(road) }))
      .filter((item) => item.len > 0)
      .sort((a, b) => b.len - a.len)
    const budget = Math.min(12, Math.max(5, Math.ceil(ranked.length * 0.35)))
    for (let i = 0; i < budget && actors.length < 18; i += 1) {
      const pick = ranked[i % ranked.length]
      salt += 1
      const h = hash01(`${seed}:${bundle.partnerId}:${salt}`)
      actors.push({
        partnerId: bundle.partnerId,
        roadIndex: pick.roadIndex,
        t: h,
        speed: 0.022 + h * 0.034,
        pingPong: h > 0.42,
        forward: h > 0.5,
        color: CAR_COLORS[Math.floor(h * CAR_COLORS.length) % CAR_COLORS.length],
      })
    }
  }
  return actors
}

function project(map: L.Map, origin: L.Point, lng: number, lat: number) {
  const pt = map.latLngToLayerPoint([lat, lng])
  return { x: pt.x - origin.x, y: pt.y - origin.y }
}

function explodeFor(partnerId: string, selected: string | null, iso3d: boolean) {
  if (!iso3d) return 0
  const ids = selectedIds(selected)
  return 0.13 + (ids.has(partnerId) ? 0.05 : 0)
}

function paint(
  canvas: HTMLCanvasElement,
  map: L.Map,
  bundles: OsmRoadBundle[],
  actors: Actor[],
  selected: string | null,
  iso3d: boolean,
  greenery: boolean,
  reduced: boolean,
  dt: number,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const size = map.getSize()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const origin = map.containerPointToLayerPoint([0, 0])
  L.DomUtil.setPosition(canvas, origin)
  canvas.width = Math.round(size.x * dpr)
  canvas.height = Math.round(size.y * dpr)
  canvas.style.width = `${size.x}px`
  canvas.style.height = `${size.y}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, size.x, size.y)

  const zoom = map.getZoom()
  const carSize = Math.max(3.4, Math.min(8, zoom * 0.4))
  const byId = new Map(bundles.map((bundle) => [bundle.partnerId, bundle]))

  // Soft highlight only on OSM centerlines the cars actually use.
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const bundle of bundles) {
    const explode = explodeFor(bundle.partnerId, selected, iso3d)
    for (const road of bundle.roads) {
      const moved = explodedRing(road, bundle.center, explode)
      if (moved.length < 2) continue
      const pts = moved.map(([lng, lat]) => project(map, origin, lng, lat))
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y)
      ctx.strokeStyle = greenery ? 'rgba(155, 231, 176, 0.14)' : 'rgba(240, 212, 138, 0.12)'
      ctx.lineWidth = Math.max(1.4, zoom * 0.14)
      ctx.stroke()
    }
  }

  if (!reduced) {
    for (const actor of actors) {
      const bundle = byId.get(actor.partnerId)
      if (!bundle) continue
      const road = bundle.roads[actor.roadIndex]
      if (!road) continue
      const len = Math.max(roadLength(road), 1e-6)
      const step = (actor.speed * dt) / Math.max(len * 70, 0.28)
      if (actor.pingPong) {
        actor.t += actor.forward ? step : -step
        if (actor.t >= 1) {
          actor.t = 1
          actor.forward = false
        } else if (actor.t <= 0) {
          actor.t = 0
          actor.forward = true
        }
      } else {
        actor.t = (actor.t + step) % 1
      }
    }
  }

  for (const actor of actors) {
    const bundle = byId.get(actor.partnerId)
    if (!bundle) continue
    const road = bundle.roads[actor.roadIndex]
    if (!road?.length) continue
    const explode = explodeFor(bundle.partnerId, selected, iso3d)
    const pos = pointOnRoad(road, actor.t)
    const delta = actor.pingPong && !actor.forward ? -0.004 : 0.004
    const look = pointOnRoad(road, Math.max(0, Math.min(1, actor.t + delta)))
    const moved = explodedRing([[pos.lng, pos.lat]], bundle.center, explode)[0] as LngLat
    const lookMoved = explodedRing([[look.lng, look.lat]], bundle.center, explode)[0] as LngLat
    const pt = project(map, origin, moved[0], moved[1])
    const angle = Math.atan2(lookMoved[1] - moved[1], lookMoved[0] - moved[0])
    const colors = greenery
      ? { body: actor.color.body, roof: '#9be7b0', light: actor.color.light }
      : actor.color
    drawCar(ctx, pt.x, pt.y, angle, carSize, colors)
  }
}

export function LifeLayer({
  selected,
  life,
  iso3d,
  greenery,
}: {
  selected: string | null
  life: boolean
  iso3d: boolean
  greenery: boolean
}) {
  const map = useMap()
  const lifeRef = useRef(life)
  const iso3dRef = useRef(iso3d)
  const greeneryRef = useRef(greenery)
  const selectedRef = useRef(selected)
  const actorsRef = useRef<Actor[]>([])
  const bundlesRef = useRef<OsmRoadBundle[]>([])
  const flyQuietUntilRef = useRef(0)
  const lastSelectedRef = useRef(selected)

  lifeRef.current = life
  iso3dRef.current = iso3d
  greeneryRef.current = greenery
  selectedRef.current = selected

  useEffect(() => {
    if (selected === lastSelectedRef.current) return
    lastSelectedRef.current = selected
    flyQuietUntilRef.current = performance.now() + 1500
    actorsRef.current = []
  }, [selected])

  useEffect(() => {
    if (!life || !selected) {
      bundlesRef.current = []
      actorsRef.current = []
      return
    }
    bundlesRef.current = getOsmRoadsForIds(partnerIdsForLife(selected))
    actorsRef.current = []
    map.fire('viewreset')
  }, [life, map, selected])

  useEffect(() => {
    const canvas = L.DomUtil.create('canvas', 'partners-life-canvas')
    canvas.setAttribute('aria-hidden', 'true')
    canvas.style.zIndex = '2'
    canvas.style.pointerEvents = 'none'
    canvas.style.display = 'none'
    map.getPanes().overlayPane.appendChild(canvas)

    let raf = 0
    let last = performance.now()
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const clear = () => {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      canvas.style.display = 'none'
    }

    const tick = (now: number) => {
      if (!lifeRef.current) {
        clear()
        actorsRef.current = []
        return
      }

      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const zoom = map.getZoom()
      const selectedId = selectedRef.current
      const quiet = now < flyQuietUntilRef.current
      const bundles = selectedId && zoom >= 13.5 && !quiet ? bundlesRef.current : []

      if (!bundles.length) {
        clear()
        raf = window.requestAnimationFrame(tick)
        return
      }

      canvas.style.display = 'block'
      if (!actorsRef.current.length) {
        actorsRef.current = spawnActors(bundles, selectedId ?? 'life')
      }

      paint(
        canvas,
        map,
        bundles,
        actorsRef.current,
        selectedId,
        iso3dRef.current,
        greeneryRef.current,
        reduced,
        dt,
      )
      raf = window.requestAnimationFrame(tick)
    }

    const start = () => {
      window.cancelAnimationFrame(raf)
      if (!lifeRef.current) {
        clear()
        return
      }
      last = performance.now()
      raf = window.requestAnimationFrame(tick)
    }

    map.on('moveend zoomend viewreset resize', start)
    start()

    return () => {
      map.off('moveend zoomend viewreset resize', start)
      window.cancelAnimationFrame(raf)
      canvas.remove()
    }
  }, [map])

  useEffect(() => {
    map.getContainer().classList.toggle('is-life', life)
    if (life) {
      flyQuietUntilRef.current = Math.max(flyQuietUntilRef.current, performance.now() + 200)
      actorsRef.current = []
      map.fire('viewreset')
    } else {
      const canvas = map
        .getPanes()
        .overlayPane.querySelector('.partners-life-canvas') as HTMLCanvasElement | null
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.setTransform(1, 0, 0, 1, 0, 0)
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
        canvas.style.display = 'none'
      }
      actorsRef.current = []
      bundlesRef.current = []
    }
  }, [map, life, selected, iso3d, greenery])

  return null
}
