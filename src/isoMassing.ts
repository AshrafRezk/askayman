import type { OsmFootprints } from './osmFootprints'

export type LngLat = [number, number]

export type IsoBuilding = {
  ring: LngLat[]
  heightM: number
  roof: 'stone' | 'gold' | 'garden'
  tone?: number
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
  /** True when massing comes from live OSM clipped to this compound. */
  osm?: boolean
}

export type ParcelLike = {
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

const TREE_CAP = 180

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

export function footprintKey(feature: ParcelLike) {
  return feature.id ?? `${feature.properties.partnerId}:${feature.properties.kind}`
}

function insetRing(ring: LngLat[], amount: number): LngLat[] {
  const center = ringCentroid(ring)
  return explodeRing(ring, center, -amount)
}

function emptySite(
  feature: ParcelLike,
  region: 'east' | 'west' | 'coast' | null,
  ring: LngLat[],
  center: LngLat,
): IsoSite {
  return {
    partnerId: feature.properties.partnerId,
    kind: feature.properties.kind,
    primary: feature.properties.primary,
    ring,
    center,
    region,
    buildings: [],
    trees: [],
    hills: [],
    pools: [],
    lawns: [],
    roads: [],
    osm: false,
  }
}

function layoutFromOsm(
  feature: ParcelLike,
  region: 'east' | 'west' | 'coast' | null,
  ring: LngLat[],
  center: LngLat,
  packed: OsmFootprints,
): IsoSite {
  const rng = rngFrom(feature.id ?? feature.properties.partnerId)
  const palm = region === 'coast'
  const buildings: IsoBuilding[] = packed.buildings.map((item) => {
    const roofRoll = rng()
    const roof: IsoBuilding['roof'] =
      item.kind === 'apartments' || item.heightM > 16
        ? roofRoll > 0.82
          ? 'gold'
          : 'stone'
        : roofRoll > 0.88
          ? 'gold'
          : roofRoll > 0.72
            ? 'garden'
            : 'stone'
    return {
      ring: insetRing(item.ring, 0.04),
      heightM: item.heightM,
      roof,
      tone: rng(),
    }
  })

  const lawns: IsoLawn[] = packed.lawns.map((item) => ({ ring: item.ring, tone: rng() }))
  if (packed.buildings.length < 90) {
    for (const building of packed.buildings) {
      lawns.push({ ring: explodeRing(building.ring, ringCentroid(building.ring), 0.16), tone: 0.2 + rng() * 0.35 })
    }
  }
  const pools: IsoPool[] = packed.pools.map((item) => ({ ring: item.ring, coastal: palm }))
  const hills: IsoHill[] = []
  const trees: IsoTree[] = []

  for (const lawn of packed.lawns) {
    const mid = ringCentroid(lawn.ring)
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const [lng, lat] of lawn.ring) {
      minX = Math.min(minX, lng)
      maxX = Math.max(maxX, lng)
      minY = Math.min(minY, lat)
      maxY = Math.max(maxY, lat)
    }
    const rx = (maxX - minX) / 2
    const ry = (maxY - minY) / 2
    if (Math.max(rx, ry) > 0.00035 && rng() > 0.35) {
      hills.push({
        lng: mid[0],
        lat: mid[1],
        rx: rx * 0.72,
        ry: ry * 0.72,
        heightM: 8 + rng() * 10,
      })
    }
    plantTrees(trees, rng, mid[0], mid[1], rx * 1.6, ry * 1.6, 6 + Math.floor(rng() * 8), palm, ring, buildings, pools)
  }

  for (const building of buildings) {
    const core = ringCentroid(building.ring)
    const pts = openRing(building.ring)
    for (let i = 0; i < pts.length; i += 1) {
      if (rng() > 0.55) continue
      const a = pts[i]
      const b = pts[(i + 1) % pts.length]
      const mid: LngLat = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
      const out: LngLat = [mid[0] * 1.45 - core[0] * 0.45, mid[1] * 1.45 - core[1] * 0.45]
      if (!pointInRing(out, ring) || inAnyBuilding(out, buildings) || inAnyPool(out, pools)) continue
      trees.push({
        lng: out[0],
        lat: out[1],
        size: rng() < 0.4 ? 2.4 + rng() * 2 : 4.2 + rng() * 4.2,
        palm: palm && rng() > 0.4,
        bush: rng() < 0.45,
      })
    }
  }

  const mids = buildings.map((item) => ringCentroid(item.ring))
  for (let i = 0; i < mids.length && trees.length < TREE_CAP; i += 1) {
    let best = -1
    let bestD = 1e9
    for (let j = i + 1; j < mids.length; j += 1) {
      const d = Math.hypot(mids[i][0] - mids[j][0], mids[i][1] - mids[j][1])
      if (d < bestD) {
        bestD = d
        best = j
      }
    }
    if (best < 0 || bestD > 0.0005) continue
    const pt: LngLat = [(mids[i][0] + mids[best][0]) / 2, (mids[i][1] + mids[best][1]) / 2]
    if (!pointInRing(pt, ring) || inAnyBuilding(pt, buildings) || inAnyPool(pt, pools)) continue
    trees.push({
      lng: pt[0],
      lat: pt[1],
      size: 3.4 + rng() * 3.6,
      palm: palm && rng() > 0.55,
      bush: rng() < 0.4,
    })
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
  let tries = 0
  const target = Math.min(TREE_CAP, 36 + buildings.length * 0.45 + packed.lawns.length * 4)
  while (trees.length < target && tries < 360) {
    tries += 1
    const pt: LngLat = [minX + rng() * spanX, minY + rng() * spanY]
    if (!pointInRing(pt, ring) || inAnyBuilding(pt, buildings) || inAnyPool(pt, pools)) continue
    const bush = rng() < 0.38
    trees.push({
      lng: pt[0],
      lat: pt[1],
      size: bush ? 2.2 + rng() * 2 : 4.6 + rng() * 5,
      palm: !bush && palm && rng() > 0.3,
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

  return {
    partnerId: feature.properties.partnerId,
    kind: feature.properties.kind,
    primary: feature.properties.primary,
    ring,
    center,
    region,
    buildings,
    trees: keptTrees.slice(0, TREE_CAP),
    hills,
    pools,
    lawns,
    roads: [],
    osm: true,
  }
}

export function siteForParcel(
  feature: ParcelLike,
  region: 'east' | 'west' | 'coast' | null,
  packed?: OsmFootprints | null,
): IsoSite {
  const ring = feature.geometry.coordinates[0] as LngLat[]
  const center = ringCentroid(ring)
  if (feature.properties.kind === 'outline') return emptySite(feature, region, ring, center)
  if (packed) return layoutFromOsm(feature, region, ring, center, packed)
  return emptySite(feature, region, ring, center)
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
