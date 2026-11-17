import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { DashboardFilters, LocationRecord } from '../types/data'
import { filterRecords, getAvailableOptions } from '../utils/analytics'

const defaults = (): DashboardFilters => ({
  source: 'ALL', province: 'ALL', regency: 'ALL', district: 'ALL', category: 'ALL', year: 'ALL', search: '',
})

export const useDashboardStore = defineStore('dashboard', () => {
  const records = ref<LocationRecord[]>([])
  const filters = ref<DashboardFilters>(defaults())
  const loading = ref(false)
  const error = ref('')
  const loaded = ref(false)

  const filteredRecords = computed(() => filterRecords(records.value, filters.value))
  const options = computed(() => getAvailableOptions(records.value, filters.value))

  async function load() {
    if (loaded.value || loading.value) return
    loading.value = true
    error.value = ''
    try {
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

  return { records, filters, loading, error, loaded, filteredRecords, options, load, setProvince, setRegency, reset }
})
