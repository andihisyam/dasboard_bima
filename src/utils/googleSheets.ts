import Papa from 'papaparse'
import type { LocationRecord, MapDescriptionStatus, Source, YearCategory } from '../types/data'
import { worstStatus } from './analytics'

export const SPREADSHEET_ID = '13cQRzYEaM8Ao6koVQVC-NNg6mRCpum7n'
export const SHEETS: Array<{ source: Source; name: string; gid: string }> = [
  { source: 'W1', name: 'Input Data W1_Kategori 1', gid: '1613945513' },
  { source: 'W2', name: 'Input Data W2_Kategori 1', gid: '1073456068' },
  { source: 'W3', name: 'Input Data W3_Kategori 1', gid: '2034039986' },
]

type SheetRow = Record<string, unknown>

function normalizeText(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const text = String(value).replace(/\s+/g, ' ').trim()
  return !text || ['-', '–', '—'].includes(text) ? null : text
}

function normalizedKey(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLocaleLowerCase('id-ID')
}

function readField(row: SheetRow, aliases: string[]): unknown {
  const entries = Object.entries(row)
  const normalizedAliases = aliases.map(normalizedKey)
  return entries.find(([key]) => normalizedAliases.includes(normalizedKey(key)))?.[1]
}

function parseYear(value: unknown): number | null {
  const text = normalizeText(value)
  if (!text) return null
  const number = Number(text.replace(',', '.'))
  if (!Number.isInteger(number) || number < 1900 || number > 2100) return null
  return number
}

function categorizeYear(year: number | null): YearCategory {
  if (year === null) return 'unknown'
  return year <= 2021 ? 'needsUpdate' : 'updated'
}

function classifyMapDescription(value: unknown): MapDescriptionStatus {
  return normalizeText(value)?.toLocaleLowerCase('id-ID') === 'sesuai' ? 'suitable' : 'no_description'
}

function hash(value: string): string {
  let result = 5381
  for (let index = 0; index < value.length; index += 1) result = ((result << 5) + result) ^ value.charCodeAt(index)
  return (result >>> 0).toString(16).padStart(8, '0')
}

export function buildSheetCsvUrl(spreadsheetId: string, gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`
}

export function applyRegencyStatuses(records: LocationRecord[]): LocationRecord[] {
  const categories = new Map<string, YearCategory[]>()
  records.forEach((record) => {
    const key = `${record.province}\u0000${record.regency}`
    categories.set(key, [...(categories.get(key) ?? []), record.yearCategory])
  })
  return records.map((record) => ({
    ...record,
    regencyStatus: worstStatus(categories.get(`${record.province}\u0000${record.regency}`) ?? []),
  }))
}

export function transformSheetRows(source: Source, rows: SheetRow[]): LocationRecord[] {
  const records = rows.flatMap((row, index): LocationRecord[] => {
    const locationName = normalizeText(readField(row, ['Nama', 'Nama Lokasi', 'Nama Kawasan']))
    const province = normalizeText(readField(row, ['Provinsi']))
    const regency = normalizeText(readField(row, ['Kota/Kabupaten', 'Kabupaten/Kota', 'Kab/Kota']))
    const district = normalizeText(readField(row, ['Kecamatan']))
    const year = parseYear(readField(row, ['Tahun']))
    const mapDescription = normalizeText(readField(row, ['Keterangan Peta']))
    if (!locationName || !province || !regency) return []

    return [{
      id: `${source.toLowerCase()}-${hash(`${index + 2}|${province}|${regency}|${locationName}`)}`,
      source,
      sourceRow: index + 2,
      province,
      regency,
      district,
      locationName,
      year,
      yearCategory: categorizeYear(year),
      regencyStatus: 'unknown',
      authority: normalizeText(readField(row, ['Kewenangan'])),
      slumLevel: normalizeText(readField(row, ['Tingkat Kekumuhan'])),
      mapDescription,
      mapDescriptionStatus: classifyMapDescription(mapDescription),
    }]
  })
  return applyRegencyStatuses(records)
}

async function fetchSheet(source: Source, name: string, gid: string): Promise<LocationRecord[]> {
  const response = await fetch(buildSheetCsvUrl(SPREADSHEET_ID, gid), { cache: 'no-store' })
  if (!response.ok) throw new Error(`Gagal membaca ${name} (${response.status})`)
  const csv = await response.text()
  const parsed = Papa.parse<SheetRow>(csv, { header: true, skipEmptyLines: 'greedy' })
  if (parsed.errors.length) {
    const serious = parsed.errors.find((error) => error.type !== 'FieldMismatch')
    if (serious) throw new Error(`${name}: ${serious.message}`)
  }
  return transformSheetRows(source, parsed.data)
}

export async function synchronizeGoogleSheets(): Promise<LocationRecord[]> {
  const sheetRecords = await Promise.all(SHEETS.map((sheet) => fetchSheet(sheet.source, sheet.name, sheet.gid)))
  const records = applyRegencyStatuses(sheetRecords.flat())
  if (!records.length) throw new Error('Spreadsheet tidak menghasilkan data lokasi.')
  return records
}
