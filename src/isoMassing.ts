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
  bush?: boolean
}

export type IsoHill = {
  lng: number
  lat: number
  rx: number
  ry: number
  heightM: number
}

export type IsoPool = {
  ring: LngLat[]
  coastal: boolean
}

export type IsoLawn = {
  ring: LngLat[]
  tone: number
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
  hills: IsoHill[]
  pools: IsoPool[]
  lawns: IsoLawn[]
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

function inAnyPool(pt: LngLat, pools: IsoPool[]): boolean {
  for (const pool of pools) {
    if (pointInRing(pt, pool.ring)) return true
  }
  return false
}

function ovalRing(cx: number, cy: number, rx: number, ry: number, rng: () => number, sides = 8): LngLat[] {
  const pts: LngLat[] = []
  for (let i = 0; i < sides; i += 1) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2
    const jitter = 0.86 + rng() * 0.22
    pts.push([cx + Math.cos(a) * rx * jitter, cy + Math.sin(a) * ry * jitter])
  }
  return pts
}

const TREE_CAP = 120

function plantTrees(
  trees: IsoTree[],
  rng: () => number,
  lng: number,
  lat: number,
  spreadX: number,
  spreadY: number,
  count: number,
  palm: boolean,
  ring: LngLat[],
  buildings: IsoBuilding[],
  pools: IsoPool[],
) {
  for (let i = 0; i < count && trees.length < TREE_CAP; i += 1) {
    const pt: LngLat = [lng + (rng() - 0.5) * spreadX, lat + (rng() - 0.5) * spreadY]
    if (!pointInRing(pt, ring) || inAnyBuilding(pt, buildings) || inAnyPool(pt, pools)) continue
    const bush = rng() < 0.3
    trees.push({
      lng: pt[0],
      lat: pt[1],
      size: bush ? 2.4 + rng() * 2.2 : 4.6 + rng() * 5.4,
      palm: !bush && palm && rng() > 0.32,
      bush,
    })
  }
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
  const hills: IsoHill[] = []
  const pools: IsoPool[] = []
  const lawns: IsoLawn[] = []

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
      hills: [],
      pools: [],
      lawns: [],
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

  const poolChance = palm ? 0.12 : 0.07
  const hillChance = palm ? 0.05 : 0.09
  const parkChance = palm ? 0.22 : 0.2

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x0 = minX + col * stepX
      const y0 = minY + row * stepY
      const x1 = x0 + stepX
      const y1 = y0 + stepY
      const mid: LngLat = [(x0 + x1) / 2, (y0 + y1) / 2]
      if (!pointInRing(mid, ring)) continue

      const edge =
        !pointInRing([x0 + stepX * 0.28, y0 + stepY * 0.28], ring) ||
        !pointInRing([x1 - stepX * 0.28, y1 - stepY * 0.28], ring)
      const lawnRing = cellRing(x0, y0, x1, y1, 0.08)
      const openLand = () => {
        lawns.push({ ring: lawnRing.every((pt) => pointInRing(pt, ring)) ? lawnRing : ovalRing(mid[0], mid[1], stepX * 0.36, stepY * 0.36, rng, 6), tone: rng() })
        plantTrees(trees, rng, mid[0], mid[1], stepX * 0.7, stepY * 0.7, 3 + Math.floor(rng() * 4), palm, ring, buildings, pools)
      }

      if (edge) {
        openLand()
        continue
      }

      const use = rng()
      if (use < poolChance) {
        const pool = ovalRing(mid[0], mid[1], stepX * (0.28 + rng() * 0.1), stepY * (0.22 + rng() * 0.1), rng, palm ? 8 : 7)
        if (pool.every((pt) => pointInRing(pt, ring))) {
          pools.push({ ring: pool, coastal: palm })
          plantTrees(trees, rng, mid[0], mid[1], stepX * 0.95, stepY * 0.95, 2, palm, ring, buildings, pools)
          continue
        }
      } else if (use < poolChance + hillChance) {
        hills.push({
          lng: mid[0],
          lat: mid[1],
          rx: stepX * (0.62 + rng() * 0.28),
          ry: stepY * (0.52 + rng() * 0.26),
          heightM: 16 + rng() * 18,
        })
        lawns.push({ ring: lawnRing, tone: 0.2 + rng() * 0.3 })
        plantTrees(trees, rng, mid[0], mid[1], stepX * 1.35, stepY * 1.35, 4 + Math.floor(rng() * 3), palm, ring, buildings, pools)
        continue
      } else if (use < poolChance + hillChance + parkChance) {
        openLand()
        continue
      }

      if (buildings.length >= 52) {
        openLand()
        continue
      }

      const inset = 0.18 + rng() * 0.12
      const footprint = cellRing(x0, y0, x1, y1, inset)
      if (!footprint.every((pt) => pointInRing(pt, ring))) {
        openLand()
        continue
      }

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
  const hedgeEvery = Math.max(1, Math.floor(pts.length / 14))
  for (let i = 0; i < pts.length; i += hedgeEvery) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    const t = 0.28 + rng() * 0.44
    const lng = a[0] + (b[0] - a[0]) * t
    const lat = a[1] + (b[1] - a[1]) * t
    const inset: LngLat = [lng + (center[0] - lng) * 0.06, lat + (center[1] - lat) * 0.06]
    if (pointInRing(inset, ring) && !inAnyBuilding(inset, buildings) && !inAnyPool(inset, pools)) {
      trees.push({ lng: inset[0], lat: inset[1], size: 4.2 + rng() * 3.8, palm, bush: rng() < 0.35 })
    }
  }

  let fillTries = 0
  while (trees.length < Math.min(TREE_CAP, 36 + lawns.length * 2) && fillTries < 280) {
    fillTries += 1
    const pt: LngLat = [minX + rng() * spanX, minY + rng() * spanY]
    if (!pointInRing(pt, ring) || inAnyBuilding(pt, buildings) || inAnyPool(pt, pools)) continue
    const bush = rng() < 0.42
    trees.push({
      lng: pt[0],
      lat: pt[1],
      size: bush ? 2.2 + rng() * 2 : 4.4 + rng() * 5.2,
      palm: !bush && palm && rng() > 0.28,
      bush,
    })
  }

  const keptTrees = trees.filter((tree) => {
    if (inAnyBuilding([tree.lng, tree.lat], buildings) || inAnyPool([tree.lng, tree.lat], pools)) return false
    for (const hill of hills) {
      const dx = (tree.lng - hill.lng) / Math.max(hill.rx, 1e-9)
      const dy = (tree.lat - hill.lat) / Math.max(hill.ry, 1e-9)
      if (dx * dx + dy * dy < 0.42) return false
    }
    return true
  })

  const roads = buildRoads(ring, buildings, minX, minY, cols, rows, stepX, stepY)

  return {
    partnerId: feature.properties.partnerId,
    kind: feature.properties.kind,
    primary: feature.properties.primary,
    ring,
    center,
    region,
    buildings,
    trees: keptTrees,
    hills,
    pools,
    lawns,
    roads,
  }
}

const siteCache = new Map<string, IsoSite>()

export function siteForParcel(
  feature: ParcelLike,
  region: 'east' | 'west' | 'coast' | null,
): IsoSite {
  const key = `${feature.id ?? `${feature.properties.partnerId}:${feature.properties.kind}`}:green3`
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

function insetPts(pts: Pt[], amount: number): Pt[] {
  if (pts.length < 3) return pts
  const cx = pts.reduce((sum, p) => sum + p.x, 0) / pts.length
  const cy = pts.reduce((sum, p) => sum + p.y, 0) / pts.length
  return pts.map((p) => ({
    x: p.x + (cx - p.x) * amount,
    y: p.y + (cy - p.y) * amount,
  }))
}

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot: number) {
  ctx.beginPath()
  ctx.ellipse(x, y, Math.max(0.6, rx), Math.max(0.4, ry), rot, 0, Math.PI * 2)
  ctx.fill()
}

export function drawHill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  heightPx: number,
  progress: number,
) {
  const h = Math.max(10, heightPx * progress)
  const layers = 8
  ctx.save()
  ctx.fillStyle = 'rgba(6, 18, 10, 0.32)'
  ellipse(ctx, x + 8, y + 7, rx * 1.12, ry * 0.78, -0.38)
  for (let i = 0; i < layers; i += 1) {
    const t = i / (layers - 1)
    const cx = x + h * 0.5 * t
    const cy = y - h * 0.88 * t
    const sx = rx * (1 - t * 0.48)
    const sy = ry * (1 - t * 0.44)
    ctx.fillStyle = `rgb(${16 + t * 28}, ${58 + t * 72}, ${28 + t * 36})`
    ellipse(ctx, cx, cy, sx, sy, -0.36)
    if (i > 1 && i < layers - 1 && i % 2 === 0) {
      ctx.strokeStyle = `rgba(${40 + t * 80}, ${90 + t * 90}, ${50 + t * 40}, 0.28)`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.ellipse(cx, cy, sx * 0.92, sy * 0.92, -0.36, 0.2, Math.PI * 1.15)
      ctx.stroke()
    }
  }
  ctx.fillStyle = 'rgba(210, 236, 170, 0.42)'
  ellipse(ctx, x + h * 0.48, y - h * 0.8, rx * 0.26, ry * 0.16, -0.4)
  ctx.restore()
}

export function drawPool(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  heightPx: number,
  coastal: boolean,
  progress: number,
) {
  if (pts.length < 3) return
  const h = Math.max(3.2, heightPx * progress)
  const top = pts.map((p) => ({ x: p.x + h * 0.5, y: p.y - h + h * 0.22 }))
  ctx.save()
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)'
  ctx.beginPath()
  ctx.moveTo(pts[0].x + 5, pts[0].y + 7)
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x + 5, pts[i].y + 7)
  ctx.closePath()
  ctx.fill()

  const faces = pts.map((a, i) => {
    const b = pts[(i + 1) % pts.length]
    return { a, b, ta: top[i], tb: top[(i + 1) % pts.length], midY: (a.y + b.y) / 2, lit: b.x - a.x > 0 }
  })
  faces.sort((left, right) => left.midY - right.midY)
  for (const face of faces) {
    ctx.beginPath()
    ctx.moveTo(face.a.x, face.a.y)
    ctx.lineTo(face.b.x, face.b.y)
    ctx.lineTo(face.tb.x, face.tb.y)
    ctx.lineTo(face.ta.x, face.ta.y)
    ctx.closePath()
    ctx.fillStyle = face.lit ? '#b7a07a' : '#7d6a4e'
    ctx.fill()
  }

  drawPolygon(ctx, top, coastal ? '#d7c4a2' : '#cbb896', 'rgba(90, 70, 42, 0.35)', 1)
  const water = insetPts(top, 0.18)
  const deep = coastal ? '#1b7f8a' : '#1c5f78'
  const shallow = coastal ? '#3ec3c9' : '#2f8aa3'
  if (water.length >= 3) {
    const cx = water.reduce((sum, p) => sum + p.x, 0) / water.length
    const cy = water.reduce((sum, p) => sum + p.y, 0) / water.length
    const g = ctx.createRadialGradient(cx - 4, cy - 6, 2, cx, cy, 28)
    g.addColorStop(0, shallow)
    g.addColorStop(1, deep)
    ctx.beginPath()
    ctx.moveTo(water[0].x, water[0].y)
    for (let i = 1; i < water.length; i += 1) ctx.lineTo(water[i].x, water[i].y)
    ctx.closePath()
    ctx.fillStyle = g
    ctx.fill()
    ctx.fillStyle = 'rgba(210, 244, 255, 0.38)'
    ellipse(ctx, cx - 6, cy - 5, 7, 3.2, -0.5)
    ctx.strokeStyle = 'rgba(180, 230, 240, 0.28)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(cx - 8, cy + 2)
    ctx.quadraticCurveTo(cx - 1, cy - 2, cx + 9, cy + 1)
    ctx.stroke()
  }
  ctx.restore()
}

export function drawTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  palm: boolean,
  progress: number,
  bush = false,
) {
  const s = size * progress
  if (s < 1.6) return
  const h = s * (bush ? 0.9 : palm ? 3.05 : 2.35)
  const tx = x + h * 0.46
  const ty = y - h + h * 0.2
  const wobble = ((x * 9.1 + y * 4.7) % 3) - 1

  ctx.save()
  ctx.fillStyle = 'rgba(8, 22, 12, 0.28)'
  ellipse(ctx, x + s * 0.4, y + s * 0.12, s * (bush ? 0.7 : 0.9), s * 0.28, -0.42)

  if (bush) {
    ctx.fillStyle = '#1d5a32'
    ellipse(ctx, tx - s * 0.12, ty + s * 0.12, s * 0.72, s * 0.48, -0.3)
    ctx.fillStyle = '#2f8a4a'
    ellipse(ctx, tx + s * 0.18, ty - s * 0.08, s * 0.58, s * 0.4, -0.22)
    ctx.fillStyle = '#4caf66'
    ellipse(ctx, tx + s * 0.02, ty - s * 0.22, s * 0.32, s * 0.22, -0.35)
    ctx.restore()
    return
  }

  ctx.strokeStyle = palm ? '#7a5a32' : '#5c3d24'
  ctx.lineWidth = Math.max(1.2, s * (palm ? 0.18 : 0.14))
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(tx, ty + s * 0.12)
  ctx.stroke()
  ctx.strokeStyle = palm ? '#c4a06a' : '#8a6238'
  ctx.lineWidth = Math.max(0.8, s * 0.07)
  ctx.beginPath()
  ctx.moveTo(x + 1.1, y - 1)
  ctx.lineTo(tx + 1, ty + s * 0.1)
  ctx.stroke()

  if (palm) {
    const fronds = 7
    for (let i = 0; i < fronds; i += 1) {
      const a = (i / fronds) * Math.PI * 1.7 - 0.85 + wobble * 0.08
      const reach = s * (1.15 + (i % 3) * 0.12)
      ctx.beginPath()
      ctx.moveTo(tx, ty)
      ctx.quadraticCurveTo(
        tx + Math.cos(a) * reach * 0.45,
        ty - s * 0.55 + Math.sin(a) * 2,
        tx + Math.cos(a) * reach,
        ty + Math.sin(a) * s * 0.42,
      )
      ctx.strokeStyle = i % 2 ? '#2f8a4a' : '#1f6a38'
      ctx.lineWidth = Math.max(1.6, s * 0.28)
      ctx.stroke()
      ctx.strokeStyle = '#56b56a'
      ctx.lineWidth = Math.max(0.8, s * 0.12)
      ctx.stroke()
    }
    ctx.fillStyle = '#3d8f52'
    ellipse(ctx, tx, ty, s * 0.28, s * 0.2, -0.2)
    ctx.fillStyle = '#8fbf62'
    ellipse(ctx, tx + 1, ty - 1.4, s * 0.12, s * 0.08, -0.3)
    ctx.restore()
    return
  }

  ctx.fillStyle = '#163f26'
  ellipse(ctx, tx - s * 0.08, ty + s * 0.28, s * 0.95, s * 0.62, -0.32)
  ctx.fillStyle = '#1f5c34'
  ellipse(ctx, tx - s * 0.32, ty + s * 0.02, s * 0.72, s * 0.5, -0.4)
  ctx.fillStyle = '#2d7a46'
  ellipse(ctx, tx + s * 0.28, ty - s * 0.08, s * 0.7, s * 0.48, -0.18)
  ctx.fillStyle = '#3d9554'
  ellipse(ctx, tx + wobble, ty - s * 0.38, s * 0.62, s * 0.42, -0.28)
  ctx.fillStyle = '#6fc56f'
  ellipse(ctx, tx + s * 0.16, ty - s * 0.55, s * 0.32, s * 0.2, -0.35)
  ctx.restore()
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
