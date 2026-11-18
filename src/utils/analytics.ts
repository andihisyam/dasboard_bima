import type { DashboardFilters, LocationRecord, RegencyAggregate, YearCategory } from '../types/data'

const statusPriority: YearCategory[] = ['below_2021', 'year_2021', 'above_2021', 'unknown']

export function worstStatus(categories: YearCategory[]): YearCategory {
  return statusPriority.find((category) => categories.includes(category)) ?? 'unknown'
}

export function filterRecords(records: LocationRecord[], filters: DashboardFilters): LocationRecord[] {
  const query = filters.search.trim().toLocaleLowerCase('id-ID')
  return records.filter((record) => {
    if (filters.source !== 'ALL' && record.source !== filters.source) return false
    if (filters.province !== 'ALL' && record.province !== filters.province) return false
    if (filters.regency !== 'ALL' && record.regency !== filters.regency) return false
    if (filters.district !== 'ALL' && record.district !== filters.district) return false
    if (filters.category !== 'ALL' && record.yearCategory !== filters.category) return false
    if (filters.year !== 'ALL' && record.year !== filters.year) return false
    if (filters.mapDescription !== 'ALL' && (record.mapDescriptionStatus ?? 'no_description') !== filters.mapDescription) return false
    if (query && !`${record.locationName} ${record.regency} ${record.district ?? ''}`.toLocaleLowerCase('id-ID').includes(query)) return false
    return true
  })
}

export function aggregateRegencies(records: LocationRecord[]): RegencyAggregate[] {
  const groups = new Map<string, LocationRecord[]>()
  records.forEach((record) => {
    const key = `${record.province}\u0000${record.regency}`
    groups.set(key, [...(groups.get(key) ?? []), record])
  })

  return [...groups.values()]
    .map((items) => {
      const counts = { below_2021: 0, year_2021: 0, above_2021: 0, unknown: 0 }
      items.forEach((item) => { counts[item.yearCategory] += 1 })
      const valid = items.length - counts.unknown
      return {
        province: items[0].province,
        regency: items[0].regency,
        total: items.length,
        ...counts,
        currentPercentage: valid ? (counts.above_2021 / valid) * 100 : 0,
        status: worstStatus(items.map((item) => item.yearCategory)),
      }
    })
    .sort((a, b) => a.regency.localeCompare(b.regency, 'id'))
}

export function getAvailableOptions(records: LocationRecord[], filters: DashboardFilters) {
  const sourceScoped = filters.source === 'ALL' ? records : records.filter((record) => record.source === filters.source)
  const provinceScoped = filters.province === 'ALL' ? sourceScoped : sourceScoped.filter((record) => record.province === filters.province)
  const regencyScoped = filters.regency === 'ALL' ? provinceScoped : provinceScoped.filter((record) => record.regency === filters.regency)
  const unique = <T>(values: T[]) => [...new Set(values)].sort((a, b) => String(a).localeCompare(String(b), 'id', { numeric: true }))

  return {
    provinces: unique(sourceScoped.map((record) => record.province)),
    regencies: unique(provinceScoped.map((record) => record.regency)),
    districts: unique(regencyScoped.map((record) => record.district).filter((value): value is string => Boolean(value))),
    years: unique(sourceScoped.map((record) => record.year).filter((value): value is number => value !== null)),
  }
}
