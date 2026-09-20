import roadsData from './data/partner-roads.json'
import { type LngLat } from './isoMassing'

export type OsmRoadBundle = {
  partnerId: string
  roads: LngLat[][]
  center: LngLat
  ring: LngLat[]
}

type RoadFeature = {
  type: 'Feature'
  properties: { partnerId: string; center: LngLat }
  geometry: { type: 'MultiLineString'; coordinates: LngLat[][] }
}

const FEATURES = (roadsData as unknown as { features: RoadFeature[] }).features

const byPartner = new Map<string, OsmRoadBundle>()
for (const feature of FEATURES) {
  const roads = feature.geometry.coordinates.filter((line) => line.length >= 2)
  if (!roads.length) continue
  byPartner.set(feature.properties.partnerId, {
    partnerId: feature.properties.partnerId,
    roads,
    center: feature.properties.center,
    ring: [],
  })
}

export function getOsmRoads(partnerId: string): OsmRoadBundle | null {
  return byPartner.get(partnerId) ?? null
}

export function getOsmRoadsForIds(ids: Iterable<string>): OsmRoadBundle[] {
  const out: OsmRoadBundle[] = []
  const seen = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) continue
    seen.add(id)
    const bundle = byPartner.get(id)
    if (bundle) out.push(bundle)
  }
  return out
}
