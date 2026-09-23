import { writeFile } from 'node:fs/promises'

const API = 'https://listing-api.nawy.com/v1/launches?page=1&pageSize=50'

async function fetchLaunches(language) {
  const response = await fetch(API, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': language,
      'User-Agent': 'AskAyman/1.0 (daily new-launches refresh)',
    },
  })
  if (!response.ok) {
    throw new Error(`Nawy launches ${language} failed: ${response.status}`)
  }
  const body = await response.json()
  if (!Array.isArray(body.results)) {
    throw new Error('Nawy launches response has no results')
  }
  return body.results
}

const [english, arabic] = await Promise.all([fetchLaunches('en'), fetchLaunches('ar')])
const arabicById = new Map(arabic.map((item) => [item.id, item]))

const launches = english.map((item) => {
  const ar = arabicById.get(item.id)
  return {
    id: item.id,
    name: item.name,
    nameAr: ar?.name ?? item.name,
    area: item.areaName ?? '',
    areaAr: ar?.areaName ?? item.areaName ?? '',
    developer: item.developerName ?? '',
    developerAr: ar?.developerName ?? item.developerName ?? '',
    imageUrl: item.imageUrl ?? '',
    minPrice: item.minPrice ?? null,
    currency: item.currency ?? 'EGP',
    href: `https://www.nawy.com/compound/${item.slugEn || item.slug}`,
  }
})

const payload = {
  source: 'https://www.nawy.com/new-launches',
  fetchedAt: new Date().toISOString(),
  launches,
}

await writeFile(new URL('../src/data/new-launches.json', import.meta.url), `${JSON.stringify(payload, null, 2)}\n`)
console.log(`Wrote ${launches.length} launches`)
