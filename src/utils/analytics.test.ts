import { describe, expect, it } from 'vitest'
import type { LocationRecord } from '../types/data'
import { aggregateRegencies, filterRecords, getAvailableOptions, paginateItems } from './analytics'

const records: LocationRecord[] = [
  { id: '1', source: 'W1', sourceRow: 2, province: 'Jambi', regency: 'Kota Jambi', district: 'Telanaipura', locationName: 'A', year: 2020, yearCategory: 'needsUpdate', regencyStatus: 'needsUpdate', authority: null, slumLevel: null, mapDescriptionStatus: 'suitable' },
  { id: '2', source: 'W1', sourceRow: 3, province: 'Jambi', regency: 'Kota Jambi', district: 'Paal Merah', locationName: 'B', year: 2024, yearCategory: 'updated', regencyStatus: 'needsUpdate', authority: null, slumLevel: null, mapDescriptionStatus: 'no_description' },
  { id: '3', source: 'W2', sourceRow: 2, province: 'Jambi', regency: 'Kerinci', district: 'Kayu Aro', locationName: 'C', year: 2021, yearCategory: 'needsUpdate', regencyStatus: 'needsUpdate', authority: null, slumLevel: null, mapDescriptionStatus: 'suitable' },
  { id: '4', source: 'W3', sourceRow: 2, province: 'Aceh', regency: 'Aceh Barat', district: 'Johan Pahlawan', locationName: 'D', year: 2024, yearCategory: 'updated', regencyStatus: 'updated', authority: null, slumLevel: null, mapDescriptionStatus: 'no_description' },
]

describe('dashboard analytics', () => {
  it('filters hierarchically and supports search', () => {
    const result = filterRecords(records, {
      source: 'ALL', province: 'Jambi', regency: 'Kota Jambi', district: 'ALL', category: 'ALL', year: 'ALL', mapDescription: 'ALL', search: 'Paal',
    })
    expect(result.map((item) => item.id)).toEqual(['2'])
  })

  it('filters locations by map description status', () => {
    const legacyRecord = { ...records[0] } as Partial<LocationRecord>
    delete legacyRecord.mapDescriptionStatus
    const result = filterRecords([...records, legacyRecord as LocationRecord], {
      source: 'ALL', province: 'ALL', regency: 'ALL', district: 'ALL', category: 'ALL', year: 'ALL', mapDescription: 'no_description', search: '',
    })
    expect(result.map((item) => item.id)).toEqual(['2', '4', '1'])
  })

  it('aggregates categories per regency and uses worst status', () => {
    const result = aggregateRegencies(records.filter((record) => record.province === 'Jambi'))
    expect(result).toEqual([
      expect.objectContaining({ regency: 'Kerinci', total: 1, needsUpdate: 1, status: 'needsUpdate' }),
      expect.objectContaining({ regency: 'Kota Jambi', total: 2, needsUpdate: 1, updated: 1, status: 'needsUpdate' }),
    ])
  })

  it('limits dependent filter options to the selected hierarchy', () => {
    const options = getAvailableOptions(records, { source: 'ALL', province: 'Jambi', regency: 'Kota Jambi', district: 'ALL', category: 'ALL', year: 'ALL', mapDescription: 'ALL', search: '' })
    expect(options.regencies).toEqual(['Kerinci', 'Kota Jambi'])
    expect(options.districts).toEqual(['Paal Merah', 'Telanaipura'])
    expect(options.years).toEqual([2020, 2021, 2024])
  })

  it('paginates province analysis rows', () => {
    expect(paginateItems(['a', 'b', 'c', 'd', 'e'], 2, 2)).toEqual(['c', 'd'])
    expect(paginateItems(['a', 'b', 'c', 'd', 'e'], 3, 2)).toEqual(['e'])
  })
})
