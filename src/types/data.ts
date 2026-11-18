export type Source = 'W1' | 'W2' | 'W3'
export type YearCategory = 'below_2021' | 'year_2021' | 'above_2021' | 'unknown'
export type MapDescriptionStatus = 'suitable' | 'no_description'

export interface LocationRecord {
  id: string
  source: Source
  sourceRow: number
  province: string
  regency: string
  district: string | null
  locationName: string
  year: number | null
  yearCategory: YearCategory
  regencyStatus: YearCategory
  authority: string | null
  slumLevel: string | null
  mapDescription?: string | null
  mapDescriptionStatus: MapDescriptionStatus
}

export interface DashboardFilters {
  source: Source | 'ALL'
  province: string
  regency: string
  district: string
  category: YearCategory | 'ALL'
  year: number | 'ALL'
  mapDescription: MapDescriptionStatus | 'ALL'
  search: string
}

export interface RegencyAggregate {
  province: string
  regency: string
  total: number
  below_2021: number
  year_2021: number
  above_2021: number
  unknown: number
  currentPercentage: number
  status: YearCategory
}
