import L from 'leaflet'
import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import parcels from '../data/partner-parcels.json'
import {
  drawPrism,
  drawTree,
  explodedRing,
  heightToPx,
  siteForParcel,
  type IsoSite,
  type LngLat,
} from '../isoMassing'
import { PARTNER_COMPOUNDS } from '../partners'

type ParcelFeature = {
  type: 'Feature'
  id?: string
  properties: {
    partnerId: string
    kind: 'compound' | 'zone' | 'outline'
    primary: boolean
  }
  geometry: {
    type: 'Polygon'
    coordinates: number[][][]
  }
}

const PARCELS = parcels as { features: ParcelFeature[] }
const REGION = Object.fromEntries(PARTNER_COMPOUNDS.map((item) => [item.id, item.region]))

function ringKey(ring: number[][]) {
  return ring.map((pt) => `${pt[0].toFixed(4)},${pt[1].toFixed(4)}`).join('|')
}

const SITES: IsoSite[] = []
const seenRings = new Set<string>()
for (const feature of PARCELS.features) {
  const key = ringKey(feature.geometry.coordinates[0] ?? [])
  if (feature.properties.kind !== 'outline' && seenRings.has(key)) continue
  if (feature.properties.kind !== 'outline') seenRings.add(key)
  SITES.push(siteForParcel(feature, REGION[feature.properties.partnerId] ?? null))
}

function selectedIds(selected: string | null) {
  const ids = new Set<string>()
  if (!selected) return ids
  ids.add(selected)
  const compound = PARTNER_COMPOUNDS.find((item) => item.id === selected)
  if (compound?.parcelId) ids.add(compound.parcelId)
  return ids
}

function selectedFamily(selected: string | null) {
  return PARTNER_COMPOUNDS.find((item) => item.id === selected)?.group ?? null
}

type DrawOpts = {
  progress: number
  greenery: boolean
  selected: string | null
}

function project(map: L.Map, origin: L.Point, lng: number, lat: number) {
  const pt = map.latLngToLayerPoint([lat, lng])
  return { x: pt.x - origin.x, y: pt.y - origin.y }
}

function projectRing(map: L.Map, origin: L.Point, ring: LngLat[]) {
  return ring.map(([lng, lat]) => project(map, origin, lng, lat))
}

function paint(canvas: HTMLCanvasElement, map: L.Map, opts: DrawOpts) {
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
  if (opts.progress < 0.02) return

  const zoom = map.getZoom()
  const explode = 0.13 * opts.progress
  const detailed = zoom >= 13.1
  const activeIds = selectedIds(opts.selected)
  const family = selectedFamily(opts.selected)

  const drawables: { sort: number; draw: () => void }[] = []

  for (const site of SITES) {
    const active = activeIds.has(site.partnerId)
    const related = Boolean(family && site.partnerId.startsWith(family === 'taj' ? 'taj' : family))
    const amount = explode + (active ? 0.05 * opts.progress : 0)
    const ground = explodedRing(site.ring, site.center, amount * 0.4)
    const groundPts = projectRing(map, origin, ground)
    if (!groundPts.length) continue

    const groundFill = opts.greenery
      ? active
        ? 'rgba(46, 122, 74, 0.46)'
        : 'rgba(24, 72, 48, 0.34)'
      : active
        ? 'rgba(42, 34, 18, 0.45)'
        : 'rgba(10, 18, 28, 0.38)'
    const groundStroke = opts.greenery
      ? active
        ? '#9be7b0'
        : '#5fa87a'
      : active || related
        ? '#f0d48a'
        : '#d4b15a'
    drawPolygonGround(ctx, groundPts, groundFill, groundStroke, site.kind === 'outline')

    if (site.kind === 'outline') continue

    if (!detailed) {
      const mass = explodedRing(site.ring, site.center, amount)
      const pts = projectRing(map, origin, mass)
      const minX = Math.min(...pts.map((p) => p.x))
      const maxX = Math.max(...pts.map((p) => p.x))
      const minY = Math.min(...pts.map((p) => p.y))
      const maxY = Math.max(...pts.map((p) => p.y))
      if (maxX - minX < 10 || maxY - minY < 10) continue
      const height = heightToPx(site.center[1], active ? 26 : 16, zoom, opts.progress)
      drawables.push({
        sort: (minY + maxY) / 2 + (minX + maxX) / 8,
        draw: () =>
          drawPrism(ctx, pts, height, wallColors(active, opts.greenery, opts.greenery ? 'garden' : 'stone')),
      })
      continue
    }

    for (const building of site.buildings) {
      const ring = explodedRing(building.ring, site.center, amount)
      const pts = projectRing(map, origin, ring)
      const cy = pts.reduce((sum, p) => sum + p.y, 0) / pts.length
      const cx = pts.reduce((sum, p) => sum + p.x, 0) / pts.length
      const roof = opts.greenery
        ? building.roof === 'gold'
          ? 'gold'
          : 'garden'
        : building.roof === 'garden'
          ? 'stone'
          : building.roof
      const height = heightToPx(site.center[1], building.heightM + (active ? 6 : 0), zoom, opts.progress)
      drawables.push({
        sort: cy + cx * 0.12,
        draw: () => drawPrism(ctx, pts, height, wallColors(active, opts.greenery, roof)),
      })
    }

    if (opts.greenery) {
      for (const tree of site.trees) {
        const moved = explodedRing([[tree.lng, tree.lat]], site.center, amount)[0]
        const pt = project(map, origin, moved[0], moved[1])
        drawables.push({
          sort: pt.y + pt.x * 0.12 + 6,
          draw: () => drawTree(ctx, pt.x, pt.y, Math.max(8, tree.size * (zoom / 13) * 1.65), tree.palm, opts.progress),
        })
      }
    }
  }

  drawables.sort((a, b) => a.sort - b.sort)
  for (const item of drawables) item.draw()
}

function drawPolygonGround(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  fill: string,
  stroke: string,
  dashed: boolean,
) {
  if (pts.length < 3) return
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  ctx.strokeStyle = stroke
  ctx.lineWidth = dashed ? 1.4 : 2
  ctx.setLineDash(dashed ? [7, 6] : [])
  ctx.stroke()
  ctx.setLineDash([])
}

function wallColors(active: boolean, greenery: boolean, roof: 'stone' | 'gold' | 'garden') {
  const top =
    roof === 'garden'
      ? active
        ? '#7dcea0'
        : '#3d8a58'
      : roof === 'gold' || active
        ? '#f0d48a'
        : '#c4a46a'
  return {
    left: active ? '#3a2e16' : '#121c28',
    right: active ? '#8a7040' : greenery ? '#24382e' : '#2a3d52',
    top,
    stroke: active ? '#f0d48a' : greenery ? 'rgba(125, 206, 160, 0.55)' : 'rgba(212, 177, 90, 0.55)',
  }
}

export function IsoMassingLayer({
  selected,
  iso3d,
  greenery,
}: {
  selected: string | null
  iso3d: boolean
  greenery: boolean
}) {
  const map = useMap()
  const iso3dRef = useRef(iso3d)
  const greeneryRef = useRef(greenery)
  const selectedRef = useRef(selected)
  const progressRef = useRef(iso3d ? 1 : 0)
  const redrawRef = useRef<() => void>(() => {})

  iso3dRef.current = iso3d
  greeneryRef.current = greenery
  selectedRef.current = selected

  useEffect(() => {
    const canvas = L.DomUtil.create('canvas', 'partners-iso-canvas')
    canvas.setAttribute('aria-hidden', 'true')
    canvas.style.zIndex = '3'
    map.getPanes().overlayPane.appendChild(canvas)
    let raf = 0
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const tick = () => {
      const target = iso3dRef.current ? 1 : 0
      const prev = progressRef.current
      progressRef.current = reduced ? target : prev + (target - prev) * 0.16
      if (Math.abs(target - progressRef.current) < 0.008) progressRef.current = target
      canvas.style.opacity = String(Math.min(1, progressRef.current * 1.15))
      canvas.style.display = progressRef.current < 0.015 ? 'none' : 'block'
      if (progressRef.current >= 0.015) {
        paint(canvas, map, {
          progress: progressRef.current,
          greenery: greeneryRef.current,
          selected: selectedRef.current,
        })
      } else {
        const ctx = canvas.getContext('2d')
        ctx?.clearRect(0, 0, canvas.width, canvas.height)
      }
      if (progressRef.current !== target) raf = window.requestAnimationFrame(tick)
    }

    const redraw = () => {
      window.cancelAnimationFrame(raf)
      raf = window.requestAnimationFrame(tick)
    }
    redrawRef.current = redraw

    map.on('move zoom viewreset resize', redraw)
    redraw()
    return () => {
      map.off('move zoom viewreset resize', redraw)
      window.cancelAnimationFrame(raf)
      canvas.remove()
    }
  }, [map])

  useEffect(() => {
    const el = map.getContainer()
    el.classList.toggle('is-iso', iso3d)
    el.classList.toggle('is-green', greenery)
    map.invalidateSize()
    redrawRef.current()
  }, [map, iso3d, greenery, selected])

  return null
}
