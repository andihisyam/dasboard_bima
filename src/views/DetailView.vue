<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ChevronLeft, ChevronRight, Database, HelpCircle, ShieldAlert, ShieldCheck } from '@lucide/vue'
import type { EChartsOption } from 'echarts'
import { useDashboardStore } from '../stores/dashboard'
import { createCompositionPieChart } from '../utils/chartConfig'
import FilterPanel from '../components/filters/FilterPanel.vue'
import StatCard from '../components/cards/StatCard.vue'
import EChart from '../components/charts/EChart.vue'
import StatusBadge from '../components/StatusBadge.vue'

const store = useDashboardStore()
const { filteredRecords } = storeToRefs(store)
const number = new Intl.NumberFormat('id-ID')
const page = ref(1)
const pageSize = ref(25)
const sortKey = ref<'locationName' | 'province' | 'regency' | 'year'>('province')
const sortDirection = ref<'asc' | 'desc'>('asc')
watch([filteredRecords, pageSize], () => { page.value = 1 })
const sorted = computed(() => [...filteredRecords.value].sort((a, b) => {
  const left = a[sortKey.value] ?? ''
  const right = b[sortKey.value] ?? ''
  const result = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), 'id', { numeric: true })
  return sortDirection.value === 'asc' ? result : -result
}))
const totalPages = computed(() => Math.max(1, Math.ceil(sorted.value.length / pageSize.value)))
const pageRows = computed(() => sorted.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))
const count = (category: string) => filteredRecords.value.filter((item) => item.yearCategory === category).length
function sort(key: typeof sortKey.value) { if (sortKey.value === key) sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'; else { sortKey.value = key; sortDirection.value = 'asc' } }
const compositionChart = computed<EChartsOption>(() =>
  createCompositionPieChart(
    { below_2021: count('below_2021'), year_2021: count('year_2021'), above_2021: count('above_2021'), unknown: count('unknown') },
    { showLabel: true, legendPosition: 'vertical-right' },
  ),
)
</script>

<template><div class="page">
  <section class="page-intro"><div><span class="eyebrow">PENELUSURAN DATA</span><h2>Detail lokasi</h2><p>Temukan lokasi yang menyebabkan suatu wilayah masih berstatus lama.</p></div><div class="data-pill"><i />{{ number.format(filteredRecords.length) }} hasil</div></section>
  <FilterPanel detail />
  <section class="detail-summary">
    <div class="stat-grid" :class="count('unknown') ? 'stat-grid--five' : 'stat-grid--four'">
      <StatCard label="Total lokasi" :value="number.format(filteredRecords.length)" note="Hasil filter aktif" :icon="Database" />
      <StatCard label="Di bawah 2021" :value="number.format(count('below_2021'))" note="Prioritas pembaruan" tone="red" :icon="ShieldAlert" />
      <StatCard label="Tahun 2021" :value="number.format(count('year_2021'))" note="Perlu perhatian" tone="yellow" :icon="HelpCircle" />
      <StatCard label="Di atas 2021" :value="number.format(count('above_2021'))" note="Data terkini" tone="green" :icon="ShieldCheck" />
      <StatCard v-if="count('unknown')" label="Belum diketahui" :value="number.format(count('unknown'))" note="Tahun perlu dilengkapi" tone="gray" :icon="HelpCircle" />
    </div>
    <article class="panel detail-summary__chart"><div class="panel__header"><div><span class="eyebrow">KOMPOSISI</span><h3>Hasil filter</h3></div></div><EChart :option="compositionChart" :height="230" /></article>
  </section>
  <article class="panel table-panel"><div class="panel__header"><div><span class="eyebrow">DATA LOKASI</span><h3>Daftar lokasi hasil filter</h3></div><div class="table-controls"><label>Baris <select v-model="pageSize"><option :value="10">10</option><option :value="25">25</option><option :value="50">50</option><option :value="100">100</option></select></label></div></div>
    <div class="table-wrap"><table><thead><tr><th>Sumber</th><th class="sortable" @click="sort('province')">Provinsi ↕</th><th class="sortable" @click="sort('regency')">Kabupaten/Kota ↕</th><th>Kecamatan</th><th class="sortable" @click="sort('locationName')">Nama Lokasi ↕</th><th class="sortable number-cell" @click="sort('year')">Tahun ↕</th><th>Kategori</th><th>Kewenangan</th><th>Tingkat kekumuhan</th><th>Keterangan peta</th></tr></thead><tbody><tr v-for="row in pageRows" :key="row.id"><td><span class="source-tag">{{ row.source }}</span></td><td>{{ row.province }}</td><td><strong>{{ row.regency }}</strong></td><td>{{ row.district ?? '—' }}</td><td>{{ row.locationName }}</td><td class="number-cell"><strong>{{ row.year ?? '—' }}</strong></td><td><StatusBadge :status="row.yearCategory" /></td><td>{{ row.authority ?? '—' }}</td><td>{{ row.slumLevel ?? '—' }}</td><td><span class="map-description-badge" :class="row.mapDescriptionStatus === 'suitable' ? 'map-description-badge--suitable' : 'map-description-badge--empty'">{{ row.mapDescriptionStatus === 'suitable' ? 'Sesuai' : 'Belum ada keterangan' }}</span></td></tr><tr v-if="!pageRows.length"><td colspan="10" class="empty-cell">Tidak ada lokasi yang sesuai dengan filter.</td></tr></tbody></table></div>
    <div class="pagination"><span>Menampilkan {{ sorted.length ? (page - 1) * pageSize + 1 : 0 }}–{{ Math.min(page * pageSize, sorted.length) }} dari {{ number.format(sorted.length) }}</span><div><button :disabled="page === 1" @click="page--"><ChevronLeft :size="17"/></button><span>Halaman {{ page }} / {{ totalPages }}</span><button :disabled="page === totalPages" @click="page++"><ChevronRight :size="17"/></button></div></div>
  </article>
</div></template>
