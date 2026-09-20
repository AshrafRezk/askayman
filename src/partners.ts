export type PartnerRegion = 'east' | 'west' | 'coast'

export type PartnerCompound = {
  id: string
  name: string
  nameAr: string
  region: PartnerRegion
  lat: number
  lng: number
  zoom: number
  logo: string
  status: 'explore' | 'sold'
}

export const PARTNER_REGIONS: {
  id: PartnerRegion | 'all'
  name: string
  nameAr: string
  lat: number
  lng: number
  zoom: number
}[] = [
  { id: 'all', name: 'All compounds', nameAr: 'كل الكمباوندات', lat: 30.3, lng: 30.3, zoom: 6.4 },
  { id: 'east', name: 'East Cairo', nameAr: 'شرق القاهرة', lat: 30.07, lng: 31.577, zoom: 11.2 },
  { id: 'west', name: 'West Cairo', nameAr: 'غرب القاهرة', lat: 30.051, lng: 30.913, zoom: 11.6 },
  { id: 'coast', name: 'North Coast', nameAr: 'الساحل الشمالي', lat: 31.13, lng: 28.045, zoom: 11.4 },
]

export const PARTNER_COMPOUNDS: PartnerCompound[] = [
  {
    id: 'taj-sultan',
    name: 'Taj Sultan',
    nameAr: 'تاج سلطان',
    region: 'east',
    lat: 30.061683,
    lng: 31.40812,
    zoom: 15.3,
    logo: 'images/partners/taj-sultan.svg',
    status: 'explore',
  },
  {
    id: 'sodic-east',
    name: 'SODIC East',
    nameAr: 'سوديك إيست',
    region: 'east',
    lat: 30.1586759,
    lng: 31.6675824,
    zoom: 14,
    logo: 'images/partners/sodic-east.png',
    status: 'explore',
  },
  {
    id: 'villette',
    name: 'Villette',
    nameAr: 'فيليت',
    region: 'east',
    lat: 30.02835,
    lng: 31.5397595,
    zoom: 14,
    logo: 'images/partners/villette.png',
    status: 'explore',
  },
  {
    id: 'eastown',
    name: 'Eastown',
    nameAr: 'إيستاون',
    region: 'east',
    lat: 30.012985336567368,
    lng: 31.515515760371557,
    zoom: 14.2,
    logo: 'images/partners/eastown.png',
    status: 'sold',
  },
  {
    id: 'kattameya-plaza',
    name: 'Kattameya Plaza',
    nameAr: 'قطامية بلازا',
    region: 'east',
    lat: 30.036557785230766,
    lng: 31.490279674530026,
    zoom: 14.2,
    logo: 'images/partners/kattameya-plaza.png',
    status: 'sold',
  },
  {
    id: 'sodic-west',
    name: 'SODIC West',
    nameAr: 'سوديك ويست',
    region: 'west',
    lat: 30.069260622164368,
    lng: 30.95695956757194,
    zoom: 14,
    logo: 'images/partners/sodic-west.png',
    status: 'sold',
  },
  {
    id: 'the-estates',
    name: 'The Estates',
    nameAr: 'ذا إستيتس',
    region: 'west',
    lat: 30.079,
    lng: 30.87833,
    zoom: 14.6,
    logo: 'images/partners/the-estates.png',
    status: 'explore',
  },
  {
    id: 'karmell',
    name: 'Karmell',
    nameAr: 'كارميل',
    region: 'west',
    lat: 30.0610487,
    lng: 30.878003,
    zoom: 14.8,
    logo: 'images/partners/karmell.png',
    status: 'explore',
  },
  {
    id: 'october-plaza',
    name: 'October Plaza',
    nameAr: 'أكتوبر بلازا',
    region: 'west',
    lat: 29.998250310787924,
    lng: 30.92364263534546,
    zoom: 14.2,
    logo: 'images/partners/october-plaza.png',
    status: 'sold',
  },
  {
    id: 'june',
    name: 'June',
    nameAr: 'جون',
    region: 'coast',
    lat: 31.0777321,
    lng: 28.0887418,
    zoom: 13.8,
    logo: 'images/partners/june.png',
    status: 'explore',
  },
  {
    id: 'caesar',
    name: 'Caesar',
    nameAr: 'سيزر',
    region: 'coast',
    lat: 31.0795179,
    lng: 28.0092651,
    zoom: 14,
    logo: 'images/partners/caesar.png',
    status: 'explore',
  },
  {
    id: 'ogami',
    name: 'Ogami',
    nameAr: 'أوغامي',
    region: 'coast',
    lat: 31.0787221,
    lng: 27.9859435,
    zoom: 14,
    logo: 'images/partners/ogami.png',
    status: 'explore',
  },
]
