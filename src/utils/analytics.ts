import type { DashboardFilters, LocationRecord, RegencyAggregate, YearCategory } from '../types/data'

const statusPriority: YearCategory[] = ['needsUpdate', 'updated', 'unknown']

export function worstStatus(categories: YearCategory[]): YearCategory {
  return statusPriority.find((category) => categories.includes(category)) ?? 'unknown'
}

export function paginateItems<T>(items: T[], page: number, pageSize: number): T[] {
  return items.slice((page - 1) * pageSize, page * pageSize)
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
      const counts = { needsUpdate: 0, updated: 0, unknown: 0 }
      items.forEach((item) => {
        if (item.yearCategory === 'unknown') counts.unknown += 1
        else counts.needsUpdate += item.yearCategory === 'needsUpdate' ? 1 : 0
        counts.updated += item.yearCategory === 'updated' ? 1 : 0
      })
      const valid = items.length - counts.unknown
      return {
        province: items[0].province,
        regency: items[0].regency,
        total: items.length,
        ...counts,
        currentPercentage: valid ? (counts.updated / valid) * 100 : 0,
        status: worstStatus(items.map((item) => item.yearCategory)),
      }
    })
    .sort((a, b) => a.regency.localeCompare(b.regency, 'id'))
}

export function getRegencyStatusSummary(aggregates: RegencyAggregate[]) {
  const clean = aggregates.filter((r) => r.status === 'updated').length
  const mixed = aggregates.length - clean
  return { clean, mixed, total: aggregates.length }
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
