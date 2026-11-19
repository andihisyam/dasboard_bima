import { describe, expect, it } from 'vitest'
import { buildSheetCsvUrl, transformSheetRows } from './googleSheets'

describe('Google Sheets synchronization', () => {
  it('builds the full CSV export endpoint using the sheet gid', () => {
    const url = buildSheetCsvUrl('abc123', '1073456068')
    expect(url).toBe('https://docs.google.com/spreadsheets/d/abc123/export?format=csv&gid=1073456068')
  })

  it('normalizes spreadsheet rows into dashboard records', () => {
    const records = transformSheetRows('W1', [
      { 'Nama ': '  Lokasi A ', Provinsi: ' Jambi ', 'Kota/Kabupaten': 'Kota Jambi', Kecamatan: 'Telanaipura', Tahun: '2020', Kewenangan: 'Kota', 'Tingkat Kekumuhan': 'Ringan' },
      { 'Nama ': 'Lokasi B', Provinsi: 'Jambi', 'Kota/Kabupaten': 'Kota Jambi', Kecamatan: 'Paal Merah', Tahun: '2024', Kewenangan: '', 'Tingkat Kekumuhan': '' },
      { 'Nama ': '', Provinsi: '', 'Kota/Kabupaten': '', Kecamatan: '', Tahun: '' },
    ])

    expect(records).toHaveLength(2)
    expect(records[0]).toEqual(expect.objectContaining({
      source: 'W1', locationName: 'Lokasi A', province: 'Jambi', year: 2020, yearCategory: 'needsUpdate', regencyStatus: 'needsUpdate',
    }))
    expect(records[1]).toEqual(expect.objectContaining({ year: 2024, yearCategory: 'updated', regencyStatus: 'needsUpdate' }))
  })

  it('marks empty and invalid years as unknown', () => {
    const records = transformSheetRows('W3', [
      { Nama: 'Lokasi C', Provinsi: 'Aceh', 'Kota/Kabupaten': 'Aceh Barat', Kecamatan: 'Johan Pahlawan', Tahun: '-' },
    ])
    expect(records[0]).toEqual(expect.objectContaining({ year: null, yearCategory: 'unknown', regencyStatus: 'unknown' }))
  })

  it('classifies Keterangan Peta as sesuai or belum ada keterangan', () => {
    const records = transformSheetRows('W2', [
      { Nama: 'Lokasi Peta A', Provinsi: 'Jambi', 'Kota/Kabupaten': 'Kota Jambi', Kecamatan: 'Paal Merah', Tahun: '2024', 'Keterangan Peta': ' Sesuai ' },
      { Nama: 'Lokasi Peta B', Provinsi: 'Jambi', 'Kota/Kabupaten': 'Kota Jambi', Kecamatan: 'Danau Sipin', Tahun: '2024', 'Keterangan Peta': '' },
    ])

    expect(records[0]).toEqual(expect.objectContaining({ mapDescription: 'Sesuai', mapDescriptionStatus: 'suitable' }))
    expect(records[1]).toEqual(expect.objectContaining({ mapDescription: null, mapDescriptionStatus: 'no_description' }))
  })
})
