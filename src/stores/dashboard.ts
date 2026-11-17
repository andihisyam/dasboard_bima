import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { DashboardFilters, LocationRecord } from '../types/data'
import { filterRecords, getAvailableOptions } from '../utils/analytics'
import { synchronizeGoogleSheets } from '../utils/googleSheets'

const CACHE_KEY = 'monev-sheets-cache-v2'
const LEGACY_CACHE_KEYS = ['monev-sheets-cache-v1']

const defaults = (): DashboardFilters => ({
  source: 'ALL', province: 'ALL', regency: 'ALL', district: 'ALL', category: 'ALL', year: 'ALL', search: '',
})

export const useDashboardStore = defineStore('dashboard', () => {
  const records = ref<LocationRecord[]>([])
  const filters = ref<DashboardFilters>(defaults())
  const loading = ref(false)
  const error = ref('')
  const loaded = ref(false)
  const syncing = ref(false)
  const syncError = ref('')
  const syncMessage = ref('')
  const lastSyncedAt = ref<string | null>(null)

  const filteredRecords = computed(() => filterRecords(records.value, filters.value))
  const options = computed(() => getAvailableOptions(records.value, filters.value))

  async function load() {
    if (loaded.value || loading.value) return
    loading.value = true
    error.value = ''
    try {
      LEGACY_CACHE_KEYS.forEach((key) => localStorage.removeItem(key))
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached) as { records: LocationRecord[]; syncedAt: string }
        if (Array.isArray(parsed.records) && parsed.records.length) {
          records.value = parsed.records
          lastSyncedAt.value = parsed.syncedAt
          loaded.value = true
          return
        }
      }
      const response = await fetch(`${import.meta.env.BASE_URL}data/location-records.json`)
      if (!response.ok) throw new Error(`Gagal memuat data (${response.status})`)
      records.value = await response.json()
      loaded.value = true
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Gagal memuat data'
    } finally {
      loading.value = false
    }
  }

  function setProvince(value: string) {
    filters.value.province = value
    filters.value.regency = 'ALL'
    filters.value.district = 'ALL'
  }

  function setRegency(value: string) {
    filters.value.regency = value
    filters.value.district = 'ALL'
  }

  function reset() { filters.value = defaults() }

  async function synchronize() {
    if (syncing.value) return
    syncing.value = true
    syncError.value = ''
    syncMessage.value = ''
    try {
      const latestRecords = await synchronizeGoogleSheets()
      const syncedAt = new Date().toISOString()
      records.value = latestRecords
      lastSyncedAt.value = syncedAt
      filters.value = defaults()
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ records: latestRecords, syncedAt }))
      } catch {
        // The live data remains available even when browser storage is full.
      }
      syncMessage.value = `${latestRecords.length.toLocaleString('id-ID')} lokasi berhasil disinkronkan.`
    } catch (cause) {
      syncError.value = cause instanceof Error ? cause.message : 'Sinkronisasi Spreadsheet gagal.'
    } finally {
      syncing.value = false
    }
  }

  return { records, filters, loading, error, loaded, syncing, syncError, syncMessage, lastSyncedAt, filteredRecords, options, load, synchronize, setProvince, setRegency, reset }
})
