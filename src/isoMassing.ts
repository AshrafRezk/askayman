export type LngLat = [number, number]

export type IsoBuilding = {
  ring: LngLat[]
  heightM: number
  roof: 'stone' | 'gold' | 'garden'
}

export type IsoTree = {
  lng: number
  lat: number
  size: number
  palm: boolean
}

export type IsoSite = {
  partnerId: string
  kind: 'compound' | 'zone' | 'outline'
  primary: boolean
  ring: LngLat[]
  center: LngLat
  region: 'east' | 'west' | 'coast' | null
  buildings: IsoBuilding[]
  trees: IsoTree[]
  /** Street centerlines in the inset gaps between building footprints. */
  roads: LngLat[][]
}

type ParcelLike = {
  id?: string
  properties: {
    partnerId: string
    kind: 'compound' | 'zone' | 'outline'
    primary: boolean
  }
  geometry: { coordinates: number[][][] }
}

function openRing(ring: LngLat[]): LngLat[] {
  if (
    ring.length > 1 &&
    ring[0][0] === ring[ring.length - 1][0] &&
    ring[0][1] === ring[ring.length - 1][1]
  ) {
    return ring.slice(0, -1)
  }
  return ring
}

export function ringCentroid(ring: LngLat[]): LngLat {
  const pts = openRing(ring)
  let area = 0
  let x = 0
  let y = 0
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const cross = pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]
    area += cross
    x += (pts[j][0] + pts[i][0]) * cross
    y += (pts[j][1] + pts[i][1]) * cross
  }
  if (Math.abs(area) < 1e-12) {
    const sum = pts.reduce<LngLat>((acc, pt) => [acc[0] + pt[0], acc[1] + pt[1]], [0, 0])
    return [sum[0] / pts.length, sum[1] / pts.length]
  }
  return [x / (3 * area), y / (3 * area)]
}

export function pointInRing(pt: LngLat, ring: LngLat[]): boolean {
  const pts = openRing(ring)
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0]
    const yi = pts[i][1]
    const xj = pts[j][0]
    const yj = pts[j][1]
    const intersect = yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi + 0.00000001) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function hash32(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function rngFrom(seed: string) {
  let a = hash32(seed) || 1
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function explodeRing(ring: LngLat[], center: LngLat, amount: number): LngLat[] {
  if (amount < 0.001) return ring
  return ring.map(([lng, lat]) => [
    center[0] + (lng - center[0]) * (1 + amount),
    center[1] + (lat - center[1]) * (1 + amount),
  ])
}

function cellRing(x0: number, y0: number, x1: number, y1: number, inset: number): LngLat[] {
  const dx = (x1 - x0) * inset
  const dy = (y1 - y0) * inset
  return [
    [x0 + dx, y0 + dy],
    [x1 - dx, y0 + dy],
    [x1 - dx, y1 - dy],
    [x0 + dx, y1 - dy],
  ]
}

function inAnyBuilding(pt: LngLat, buildings: IsoBuilding[]): boolean {
  for (const building of buildings) {
    if (pointInRing(pt, building.ring)) return true
  }
  return false
}

function polylineLength(line: LngLat[]): number {
  let sum = 0
  for (let i = 1; i < line.length; i += 1) {
    const dx = line[i][0] - line[i - 1][0]
    const dy = line[i][1] - line[i - 1][1]
    sum += Math.hypot(dx, dy)
  }
  return sum
}

/** Sample a grid edge and split into street segments that stay off buildings. */
function clipStreetLine(
  samples: LngLat[],
  parcel: LngLat[],
  buildings: IsoBuilding[],
  minLen: number,
): LngLat[][] {
  const out: LngLat[][] = []
  let current: LngLat[] = []
  for (const pt of samples) {
    const ok = pointInRing(pt, parcel) && !inAnyBuilding(pt, buildings)
    if (ok) {
      current.push(pt)
    } else if (current.length >= 2) {
      if (polylineLength(current) >= minLen) out.push(current)
      current = []
    } else {
      current = []
    }
  }
  if (current.length >= 2 && polylineLength(current) >= minLen) out.push(current)
  return out
}

function buildRoads(
  ring: LngLat[],
  buildings: IsoBuilding[],
  minX: number,
  minY: number,
  cols: number,
  rows: number,
  stepX: number,
  stepY: number,
): LngLat[][] {
  if (!buildings.length) return []
  const roads: LngLat[][] = []
  const minLen = Math.min(stepX, stepY) * 0.55
  const samplesPerCell = 5

  for (let row = 0; row <= rows; row += 1) {
    const y = minY + row * stepY
    const samples: LngLat[] = []
    const steps = cols * samplesPerCell
    for (let i = 0; i <= steps; i += 1) {
      samples.push([minX + (i / steps) * cols * stepX, y])
    }
    roads.push(...clipStreetLine(samples, ring, buildings, minLen))
  }

  for (let col = 0; col <= cols; col += 1) {
    const x = minX + col * stepX
    const samples: LngLat[] = []
    const steps = rows * samplesPerCell
    for (let i = 0; i <= steps; i += 1) {
      samples.push([x, minY + (i / steps) * rows * stepY])
    }
    roads.push(...clipStreetLine(samples, ring, buildings, minLen))
  }

  return roads
}

function layoutSite(
  feature: ParcelLike,
  region: 'east' | 'west' | 'coast' | null,
): IsoSite {
  const ring = feature.geometry.coordinates[0] as LngLat[]
  const center = ringCentroid(ring)
  const rng = rngFrom(feature.id ?? feature.properties.partnerId)
  const palm = region === 'coast'
  const buildings: IsoBuilding[] = []
  const trees: IsoTree[] = []

  if (feature.properties.kind === 'outline') {
    return {
      partnerId: feature.properties.partnerId,
      kind: feature.properties.kind,
      primary: feature.properties.primary,
      ring,
      center,
      region,
      buildings,
      trees,
      roads: [],
    }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [lng, lat] of ring) {
    minX = Math.min(minX, lng)
    maxX = Math.max(maxX, lng)
    minY = Math.min(minY, lat)
    maxY = Math.max(maxY, lat)
  }

  const spanX = maxX - minX
  const spanY = maxY - minY
  const short = Math.min(spanX, spanY)
  const long = Math.max(spanX, spanY)
  const cell = Math.max(0.00018, Math.min(short / 6.2, long / 14, 0.00072))
  const cols = Math.max(2, Math.min(14, Math.round(spanX / cell)))
  const rows = Math.max(2, Math.min(14, Math.round(spanY / cell)))
  const stepX = spanX / cols
  const stepY = spanY / rows

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (buildings.length >= 52) break
      const x0 = minX + col * stepX
      const y0 = minY + row * stepY
      const x1 = x0 + stepX
      const y1 = y0 + stepY
      const mid: LngLat = [(x0 + x1) / 2, (y0 + y1) / 2]
      if (!pointInRing(mid, ring)) continue
      if (!pointInRing([x0 + stepX * 0.28, y0 + stepY * 0.28], ring)) continue

      const courtyard = rng() < (palm ? 0.28 : 0.16)
      if (courtyard) {
        trees.push({ lng: mid[0], lat: mid[1], size: 5 + rng() * 5, palm })
        if (rng() > 0.45) {
          trees.push({
            lng: mid[0] + (rng() - 0.5) * stepX * 0.35,
            lat: mid[1] + (rng() - 0.5) * stepY * 0.35,
            size: 4 + rng() * 4,
            palm,
          })
        }
        continue
      }

      const inset = 0.18 + rng() * 0.12
      const footprint = cellRing(x0, y0, x1, y1, inset)
      if (!footprint.every((pt) => pointInRing(pt, ring))) continue

      const roll = rng()
      let heightM = 8 + rng() * 7
      if (palm) heightM = 4.5 + rng() * 6.5
      else if (roll > 0.9) heightM = 28 + rng() * 20
      else if (roll > 0.58) heightM = 13 + rng() * 11

      const roofRoll = rng()
      const roof: IsoBuilding['roof'] = roofRoll > 0.9 ? 'gold' : roofRoll > 0.62 ? 'garden' : 'stone'
      buildings.push({ ring: footprint, heightM, roof })
    }
  }

  const pts = openRing(ring)
  const hedgeEvery = Math.max(1, Math.floor(pts.length / 10))
  for (let i = 0; i < pts.length; i += hedgeEvery) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    const t = 0.35 + rng() * 0.3
    const lng = a[0] + (b[0] - a[0]) * t
    const lat = a[1] + (b[1] - a[1]) * t
    const inset: LngLat = [lng + (center[0] - lng) * 0.08, lat + (center[1] - lat) * 0.08]
    if (pointInRing(inset, ring)) {
      trees.push({ lng: inset[0], lat: inset[1], size: 4.5 + rng() * 3.5, palm })
    }
  }

  const roads = buildRoads(ring, buildings, minX, minY, cols, rows, stepX, stepY)

  return {
    partnerId: feature.properties.partnerId,
    kind: feature.properties.kind,
    primary: feature.properties.primary,
    ring,
    center,
    region,
    buildings,
    trees,
    roads,
  }
}

const siteCache = new Map<string, IsoSite>()

export function siteForParcel(
  feature: ParcelLike,
  region: 'east' | 'west' | 'coast' | null,
): IsoSite {
  const key = feature.id ?? `${feature.properties.partnerId}:${feature.properties.kind}`
  const hit = siteCache.get(key)
  if (hit) return hit
  const site = layoutSite(feature, region)
  siteCache.set(key, site)
  return site
}

export function explodedRing(ring: LngLat[], center: LngLat, explode: number): LngLat[] {
  return explodeRing(ring, center, explode)
}

type Pt = { x: number; y: number }

function drawPolygon(ctx: CanvasRenderingContext2D, pts: Pt[], fill: string, stroke: string, width: number) {
  if (pts.length < 3) return
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  if (width > 0) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = width
    ctx.stroke()
  }
}

export function drawPrism(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  heightPx: number,
  colors: { left: string; right: string; top: string; stroke: string },
) {
  if (pts.length < 3 || heightPx < 0.6) {
    drawPolygon(ctx, pts, colors.top, colors.stroke, 0.8)
    return
  }

  const shearX = heightPx * 0.5
  const shearY = heightPx * 0.22
  const top = pts.map((p) => ({ x: p.x + shearX, y: p.y - heightPx + shearY }))

  ctx.save()
  ctx.fillStyle = 'rgba(0, 0, 0, 0.26)'
  ctx.beginPath()
  ctx.moveTo(pts[0].x + 7, pts[0].y + 9)
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x + 7, pts[i].y + 9)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  const faces = pts.map((a, i) => {
    const b = pts[(i + 1) % pts.length]
    return {
      a,
      b,
      ta: top[i],
      tb: top[(i + 1) % pts.length],
      midY: (a.y + b.y) / 2,
      lit: b.x - a.x > 0 || b.y - a.y > 0,
    }
  })
  faces.sort((a, b) => a.midY - b.midY)

  for (const face of faces) {
    ctx.beginPath()
    ctx.moveTo(face.a.x, face.a.y)
    ctx.lineTo(face.b.x, face.b.y)
    ctx.lineTo(face.tb.x, face.tb.y)
    ctx.lineTo(face.ta.x, face.ta.y)
    ctx.closePath()
    ctx.fillStyle = face.lit ? colors.right : colors.left
    ctx.fill()
  }

  drawPolygon(ctx, top, colors.top, colors.stroke, 1)
}

export function drawTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  palm: boolean,
  progress: number,
) {
  const h = size * (palm ? 3.1 : 2.15) * progress
  if (h < 2) return
  const tx = x + h * 0.5
  const ty = y - h + h * 0.22

  ctx.strokeStyle = '#5a3b24'
  ctx.lineWidth = Math.max(1.1, size * 0.16)
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(tx, ty)
  ctx.stroke()

  if (palm) {
    ctx.strokeStyle = '#2f7a45'
    ctx.lineWidth = Math.max(1.4, size * 0.22)
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2 - 0.4
      ctx.beginPath()
      ctx.moveTo(tx, ty)
      ctx.quadraticCurveTo(
        tx + Math.cos(a) * size * 0.6,
        ty + Math.sin(a) * size * 0.15 - size * 0.4,
        tx + Math.cos(a) * size * 1.35,
        ty + Math.sin(a) * size * 0.45,
      )
      ctx.stroke()
    }
    ctx.fillStyle = '#3d8f52'
    ctx.beginPath()
    ctx.arc(tx, ty, Math.max(1.6, size * 0.28), 0, Math.PI * 2)
    ctx.fill()
    return
  }

  ctx.fillStyle = '#1f5a34'
  ctx.beginPath()
  ctx.moveTo(tx, ty - size * 1.15)
  ctx.lineTo(tx + size * 1.05, ty + size * 0.38)
  ctx.lineTo(tx - size * 1.05, ty + size * 0.38)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#327a4c'
  ctx.beginPath()
  ctx.moveTo(tx, ty - size * 0.55)
  ctx.lineTo(tx + size * 0.78, ty + size * 0.48)
  ctx.lineTo(tx - size * 0.78, ty + size * 0.48)
  ctx.closePath()
  ctx.fill()
}

export function heightToPx(lat: number, meters: number, zoom: number, progress: number) {
  const metersPerPx = (40075016.686 * Math.cos((lat * Math.PI) / 180)) / (256 * 2 ** zoom)
  return Math.min(110, (meters / Math.max(metersPerPx, 0.35)) * 3.15 * progress)
}

export function roadLength(line: LngLat[]): number {
  return polylineLength(line)
}

/** Point and heading along a polyline at progress t in [0, 1]. */
export function pointOnRoad(line: LngLat[], t: number): { lng: number; lat: number; angle: number } {
  if (line.length < 2) {
    const pt = line[0] ?? [0, 0]
    return { lng: pt[0], lat: pt[1], angle: 0 }
  }
  const total = polylineLength(line)
  if (total < 1e-12) {
    return { lng: line[0][0], lat: line[0][1], angle: 0 }
  }
  let target = Math.max(0, Math.min(1, t)) * total
  for (let i = 1; i < line.length; i += 1) {
    const a = line[i - 1]
    const b = line[i]
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (target <= seg || i === line.length - 1) {
      const u = seg < 1e-12 ? 0 : Math.min(1, target / seg)
      return {
        lng: a[0] + (b[0] - a[0]) * u,
        lat: a[1] + (b[1] - a[1]) * u,
        angle: Math.atan2(b[1] - a[1], b[0] - a[0]),
      }
    }
    target -= seg
  }
  const last = line[line.length - 1]
  const prev = line[line.length - 2]
  return { lng: last[0], lat: last[1], angle: Math.atan2(last[1] - prev[1], last[0] - prev[0]) }
}

export function drawCar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size: number,
  colors: { body: string; roof: string; light: string },
) {
  if (size < 2.2) return
  ctx.save()
  ctx.translate(x, y)
  // Screen coords: lng/lat deltas map roughly to x / -y for heading feel on the map.
  ctx.rotate(-angle)
  ctx.fillStyle = 'rgba(0,0,0,0.28)'
  ctx.beginPath()
  ctx.ellipse(0.6, 1.2, size * 0.55, size * 0.28, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = colors.body
  ctx.beginPath()
  ctx.moveTo(-size * 0.7, -size * 0.28)
  ctx.lineTo(size * 0.55, -size * 0.28)
  ctx.lineTo(size * 0.72, 0)
  ctx.lineTo(size * 0.55, size * 0.28)
  ctx.lineTo(-size * 0.7, size * 0.28)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = colors.roof
  ctx.beginPath()
  ctx.moveTo(-size * 0.28, -size * 0.2)
  ctx.lineTo(size * 0.18, -size * 0.2)
  ctx.lineTo(size * 0.28, 0)
  ctx.lineTo(size * 0.18, size * 0.2)
  ctx.lineTo(-size * 0.28, size * 0.2)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = colors.light
  ctx.beginPath()
  ctx.arc(size * 0.62, -size * 0.12, size * 0.08, 0, Math.PI * 2)
  ctx.arc(size * 0.62, size * 0.12, size * 0.08, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
