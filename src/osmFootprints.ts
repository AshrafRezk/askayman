type LngLat = [number, number]

export type OsmPackedBuilding = {
  ring: LngLat[]
  heightM: number
  kind: string
  numbered?: boolean
}

export type OsmPackedLawn = {
  ring: LngLat[]
  kind: string
}

export type OsmPackedPool = {
  ring: LngLat[]
}

export type OsmFootprints = {
  buildings: OsmPackedBuilding[]
  lawns: OsmPackedLawn[]
  pools: OsmPackedPool[]
}

const MEMORY = new Map<string, OsmFootprints>()
const INFLIGHT = new Map<string, Promise<OsmFootprints | null>>()
const FAILED_AT = new Map<string, number>()
const SESSION_PREFIX = 'osm-fp:v1:'
const RETRY_MS = 12_000
const BUILDING_CAP = 260
const LAWN_CAP = 40
const POOL_CAP = 16

const GREEN_LEISURE = new Set(['park', 'garden', 'pitch', 'playground', 'golf_course', 'recreation_ground'])
const GREEN_LANDUSE = new Set(['grass', 'forest', 'meadow', 'recreation_ground', 'village_green', 'orchard'])
const GREEN_NATURAL = new Set(['wood', 'scrub', 'grassland'])
const WATER_LEISURE = new Set(['swimming_pool'])
const WATER_NATURAL = new Set(['water'])
const WATER_LANDUSE = new Set(['basin', 'reservoir'])

const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

type ParcelKeyLike = {
  id?: string
  properties: { partnerId: string; kind: string }
}

export function parcelKey(feature: ParcelKeyLike) {
  return feature.id ?? `${feature.properties.partnerId}:${feature.properties.kind}`
}

export function ringBBox(ring: LngLat[], pad = 0.00022): [number, number, number, number] {
  let west = Infinity
  let south = Infinity
  let east = -Infinity
  let north = -Infinity
  for (const [lng, lat] of ring) {
    west = Math.min(west, lng)
    east = Math.max(east, lng)
    south = Math.min(south, lat)
    north = Math.max(north, lat)
  }
  return [west - pad, south - pad, east + pad, north + pad]
}

function openRing(ring: LngLat[]): LngLat[] {
  if (ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]) {
    return ring.slice(0, -1)
  }
  return ring
}

function pointInRing(pt: LngLat, ring: LngLat[]): boolean {
  const pts = openRing(ring)
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0]
    const yi = pts[i][1]
    const xj = pts[j][0]
    const yj = pts[j][1]
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi + 1e-12) + xi) inside = !inside
  }
  return inside
}

function centroid(ring: LngLat[]): LngLat {
  const pts = openRing(ring)
  if (!pts.length) return [0, 0]
  let x = 0
  let y = 0
  for (const pt of pts) {
    x += pt[0]
    y += pt[1]
  }
  return [x / pts.length, y / pts.length]
}

function ringAreaM2(ring: LngLat[]): number {
  const pts = openRing(ring)
  if (pts.length < 3) return 0
  const lat = centroid(ring)[1]
  let a = 0
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]
  }
  const deg2 = Math.abs(a) / 2
  return deg2 * 111320 * 111320 * Math.max(0.2, Math.abs(Math.cos((lat * Math.PI) / 180)))
}

function simplify(ring: LngLat[], maxPts = 16): LngLat[] {
  const pts = openRing(ring)
  if (pts.length <= maxPts) return pts
  const step = pts.length / maxPts
  return Array.from({ length: maxPts }, (_, i) => pts[Math.min(pts.length - 1, Math.floor(i * step))])
}

function villaRing(lng: number, lat: number, w = 0.000085, h = 0.00007): LngLat[] {
  return [
    [lng - w, lat - h],
    [lng + w, lat - h],
    [lng + w, lat + h],
    [lng - w, lat + h],
  ]
}

function nearAny(pt: LngLat, rings: LngLat[][], thresh = 0.0002): boolean {
  const t2 = thresh * thresh
  for (const ring of rings) {
    const mid = centroid(ring)
    const dx = pt[0] - mid[0]
    const dy = pt[1] - mid[1]
    if (dx * dx + dy * dy < t2) return true
    if (pointInRing(pt, ring)) return true
  }
  return false
}

function heightFor(tags: Record<string, string>, area: number): number {
  if (tags.height) {
    const n = Number.parseFloat(tags.height.replace('m', '').split(';')[0])
    if (Number.isFinite(n)) return Math.max(4, Math.min(70, n))
  }
  if (tags['building:levels']) {
    const n = Number.parseFloat(tags['building:levels'].split(';')[0])
    if (Number.isFinite(n)) return Math.max(4.5, Math.min(70, n * 3.15))
  }
  const kind = tags.building ?? 'yes'
  if ((kind === 'apartments' || kind === 'residential') && area > 900) return 16 + Math.min(22, (area - 900) / 180)
  if (kind === 'apartments' || kind === 'commercial' || kind === 'retail' || kind === 'office') return 14
  if (kind === 'house' || kind === 'detached' || kind === 'villa' || kind === 'semidetached_house' || kind === 'terrace') {
    return 8.5
  }
  if (area > 1400) return 18
  if (area < 80) return 5.5
  return 9.2
}

function classify(tags: Record<string, string>): 'building' | 'pool' | 'lawn' | null {
  const building = tags.building
  if (building && building !== 'no' && building !== 'roof') return 'building'
  if (WATER_LEISURE.has(tags.leisure) || WATER_NATURAL.has(tags.natural) || WATER_LANDUSE.has(tags.landuse)) return 'pool'
  if (GREEN_LEISURE.has(tags.leisure) || GREEN_LANDUSE.has(tags.landuse) || GREEN_NATURAL.has(tags.natural)) return 'lawn'
  return null
}

function capBuildings(buildings: OsmPackedBuilding[], limit = BUILDING_CAP): OsmPackedBuilding[] {
  if (buildings.length <= limit) return buildings
  return [...buildings]
    .sort((a, b) => {
      const numbered = Number(Boolean(b.numbered)) - Number(Boolean(a.numbered))
      if (numbered) return numbered
      return ringAreaM2(b.ring) - ringAreaM2(a.ring)
    })
    .slice(0, limit)
}

function tagsFromEl(el: { tags?: Record<string, string> } | Element): Record<string, string> {
  if ('tags' in el && el.tags) return el.tags
  const tags: Record<string, string> = {}
  if (el instanceof Element) {
    for (const tag of el.querySelectorAll('tag')) {
      const k = tag.getAttribute('k')
      const v = tag.getAttribute('v')
      if (k && v) tags[k] = v
    }
  }
  return tags
}

function collect(items: Array<{ ring: LngLat[]; tags: Record<string, string>; numberedNode?: boolean }>, parcel: LngLat[]): OsmFootprints {
  const buildings: OsmPackedBuilding[] = []
  const lawns: OsmPackedLawn[] = []
  const pools: OsmPackedPool[] = []
  for (const item of items) {
    const ring = simplify(item.ring)
    if (ring.length < 3) continue
    const mid = centroid(ring)
    if (!pointInRing(mid, parcel)) continue
    if (item.numberedNode) continue
    const kind = classify(item.tags)
    if (kind === 'building') {
      const area = ringAreaM2(ring)
      buildings.push({
        ring,
        heightM: Math.round(heightFor(item.tags, area) * 10) / 10,
        kind: item.tags.building ?? 'house',
        numbered: Boolean(item.tags['addr:housenumber'] || item.tags.name || item.numberedNode),
      })
    } else if (kind === 'pool') {
      pools.push({ ring })
    } else if (kind === 'lawn') {
      lawns.push({ ring, kind: item.tags.leisure || item.tags.landuse || item.tags.natural || 'grass' })
    }
  }

  const occupied = buildings.map((item) => item.ring)
  for (const item of items) {
    if (!item.numberedNode) continue
    const pt = centroid(item.ring)
    if (!pointInRing(pt, parcel) || nearAny(pt, occupied)) continue
    const ring = villaRing(pt[0], pt[1])
    buildings.push({ ring, heightM: 8.8, kind: 'house', numbered: true })
    occupied.push(ring)
  }

  return {
    buildings: capBuildings(buildings),
    lawns: lawns.slice(0, LAWN_CAP),
    pools: pools.slice(0, POOL_CAP),
  }
}

type OverpassEl = {
  type: string
  lat?: number
  lon?: number
  tags?: Record<string, string>
  geometry?: { lat: number; lon: number }[]
}

function parseOverpass(elements: OverpassEl[], parcel: LngLat[]): OsmFootprints {
  const items: Array<{ ring: LngLat[]; tags: Record<string, string>; numberedNode?: boolean }> = []
  for (const el of elements) {
    const tags = el.tags ?? {}
    if (el.type === 'way' && el.geometry && el.geometry.length >= 3) {
      items.push({
        ring: el.geometry.map((pt) => [pt.lon, pt.lat] as LngLat),
        tags,
      })
    } else if (el.type === 'node' && tags['addr:housenumber'] && el.lat != null && el.lon != null) {
      items.push({
        ring: villaRing(el.lon, el.lat),
        tags,
        numberedNode: true,
      })
    }
  }
  return collect(items, parcel)
}

function parseOsmXml(xml: string, parcel: LngLat[]): OsmFootprints | null {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.querySelector('parsererror')) return null
  const nodes = new Map<string, LngLat>()
  for (const node of doc.querySelectorAll('node')) {
    const id = node.getAttribute('id')
    const lon = node.getAttribute('lon')
    const lat = node.getAttribute('lat')
    if (id && lon && lat) nodes.set(id, [Number(lon), Number(lat)])
  }
  const items: Array<{ ring: LngLat[]; tags: Record<string, string>; numberedNode?: boolean }> = []
  for (const way of doc.querySelectorAll('way')) {
    const tags = tagsFromEl(way)
    const ring: LngLat[] = []
    for (const nd of way.querySelectorAll('nd')) {
      const ref = nd.getAttribute('ref')
      const pt = ref ? nodes.get(ref) : undefined
      if (pt) ring.push(pt)
    }
    if (ring.length >= 3) items.push({ ring, tags })
  }
  for (const node of doc.querySelectorAll('node')) {
    const tags = tagsFromEl(node)
    if (!tags['addr:housenumber']) continue
    const lon = node.getAttribute('lon')
    const lat = node.getAttribute('lat')
    if (lon == null || lat == null) continue
    items.push({
      ring: villaRing(Number(lon), Number(lat)),
      tags,
      numberedNode: true,
    })
  }
  return collect(items, parcel)
}

function overpassQuery(west: number, south: number, east: number, north: number) {
  const bbox = `${south.toFixed(6)},${west.toFixed(6)},${north.toFixed(6)},${east.toFixed(6)}`
  return `[out:json][timeout:25];
(
  way["building"](${bbox});
  way["leisure"~"^(park|garden|pitch|playground|golf_course|recreation_ground)$"](${bbox});
  way["landuse"~"^(grass|forest|meadow|recreation_ground|village_green|orchard)$"](${bbox});
  way["natural"~"^(wood|scrub|grassland|water)$"](${bbox});
  way["leisure"="swimming_pool"](${bbox});
  way["landuse"~"^(basin|reservoir)$"](${bbox});
  node["addr:housenumber"](${bbox});
);
out tags geom;`
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController()
  const timer = window.setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, {
      ...init,
      signal: init.signal ?? ctrl.signal,
    })
  } finally {
    window.clearTimeout(timer)
  }
}

async function fetchOverpass(ring: LngLat[]): Promise<OsmFootprints | null> {
  const [west, south, east, north] = ringBBox(ring)
  const query = overpassQuery(west, south, east, north)
  const body = new URLSearchParams({ data: query }).toString()
  for (const url of OVERPASS) {
    try {
      const res = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          },
          body,
        },
        22_000,
      )
      if (!res.ok) continue
      const json = (await res.json()) as { elements?: OverpassEl[] }
      if (!json.elements) continue
      return parseOverpass(json.elements, ring)
    } catch {
      continue
    }
  }
  return null
}

async function fetchOsmApi(ring: LngLat[]): Promise<OsmFootprints | null> {
  const [west, south, east, north] = ringBBox(ring)
  const url = `https://api.openstreetmap.org/api/0.6/map?bbox=${west.toFixed(6)},${south.toFixed(6)},${east.toFixed(6)},${north.toFixed(6)}`
  try {
    const res = await fetchWithTimeout(url, {}, 18_000)
    if (!res.ok) return null
    const xml = await res.text()
    return parseOsmXml(xml, ring)
  } catch {
    return null
  }
}

function readSession(key: string): OsmFootprints | null {
  try {
    const raw = sessionStorage.getItem(SESSION_PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as OsmFootprints
    if (!parsed || !Array.isArray(parsed.buildings)) return null
    return parsed
  } catch {
    return null
  }
}

function writeSession(key: string, packed: OsmFootprints) {
  try {
    sessionStorage.setItem(SESSION_PREFIX + key, JSON.stringify(packed))
  } catch {
    /* quota */
  }
}

let activeFetches = 0
const waiters: Array<() => void> = []

async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (activeFetches >= 2) {
    await new Promise<void>((resolve) => waiters.push(resolve))
  }
  activeFetches += 1
  try {
    return await fn()
  } finally {
    activeFetches -= 1
    waiters.shift()?.()
  }
}

export function peekOsmFootprints(key: string): OsmFootprints | null {
  const hit = MEMORY.get(key)
  if (hit) return hit
  const stored = readSession(key)
  if (stored) {
    MEMORY.set(key, stored)
    return stored
  }
  return null
}

export async function loadOsmFootprints(key: string, ring: LngLat[]): Promise<OsmFootprints | null> {
  const cached = peekOsmFootprints(key)
  if (cached) return cached
  const pending = INFLIGHT.get(key)
  if (pending) return pending
  const failed = FAILED_AT.get(key)
  if (failed && Date.now() - failed < RETRY_MS) return null

  const job = withSlot(async () => {
    const packed = (await fetchOsmApi(ring)) ?? (await fetchOverpass(ring))
    if (packed) {
      MEMORY.set(key, packed)
      writeSession(key, packed)
      FAILED_AT.delete(key)
      return packed
    }
    FAILED_AT.set(key, Date.now())
    return null
  })
  INFLIGHT.set(key, job)
  try {
    return await job
  } finally {
    INFLIGHT.delete(key)
  }
}
