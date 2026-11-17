import { describe, expect, it } from 'vitest'
import type { LocationRecord } from '../types/data'
import { aggregateRegencies, filterRecords, getAvailableOptions } from './analytics'

const records: LocationRecord[] = [
  { id: '1', source: 'W1', sourceRow: 2, province: 'Jambi', regency: 'Kota Jambi', district: 'Telanaipura', locationName: 'A', year: 2020, yearCategory: 'below_2021', regencyStatus: 'below_2021', authority: null, slumLevel: null },
  { id: '2', source: 'W1', sourceRow: 3, province: 'Jambi', regency: 'Kota Jambi', district: 'Paal Merah', locationName: 'B', year: 2024, yearCategory: 'above_2021', regencyStatus: 'below_2021', authority: null, slumLevel: null },
  { id: '3', source: 'W2', sourceRow: 2, province: 'Jambi', regency: 'Kerinci', district: 'Kayu Aro', locationName: 'C', year: 2021, yearCategory: 'year_2021', regencyStatus: 'year_2021', authority: null, slumLevel: null },
  { id: '4', source: 'W3', sourceRow: 2, province: 'Aceh', regency: 'Aceh Barat', district: 'Johan Pahlawan', locationName: 'D', year: 2024, yearCategory: 'above_2021', regencyStatus: 'above_2021', authority: null, slumLevel: null },
]

describe('dashboard analytics', () => {
  it('filters hierarchically and supports search', () => {
    const result = filterRecords(records, {
      source: 'ALL', province: 'Jambi', regency: 'Kota Jambi', district: 'ALL', category: 'ALL', year: 'ALL', search: 'Paal',
    })
    expect(result.map((item) => item.id)).toEqual(['2'])
  })

  it('aggregates categories per regency and uses worst status', () => {
    const result = aggregateRegencies(records.filter((record) => record.province === 'Jambi'))
    expect(result).toEqual([
      expect.objectContaining({ regency: 'Kerinci', total: 1, year_2021: 1, status: 'year_2021' }),
      expect.objectContaining({ regency: 'Kota Jambi', total: 2, below_2021: 1, above_2021: 1, status: 'below_2021' }),
    ])
  })

  it('limits dependent filter options to the selected hierarchy', () => {
    const options = getAvailableOptions(records, { source: 'ALL', province: 'Jambi', regency: 'Kota Jambi', district: 'ALL', category: 'ALL', year: 'ALL', search: '' })
    expect(options.regencies).toEqual(['Kerinci', 'Kota Jambi'])
    expect(options.districts).toEqual(['Paal Merah', 'Telanaipura'])
    expect(options.years).toEqual([2020, 2021, 2024])
  })
})
