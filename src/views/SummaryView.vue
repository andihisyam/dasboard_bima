<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { Building2, Database, MapPin, ShieldAlert, ShieldCheck } from '@lucide/vue'
import type { EChartsOption } from 'echarts'
import { useDashboardStore } from '../stores/dashboard'
import { aggregateRegencies } from '../utils/analytics'
import { createCompositionPieChart } from '../utils/chartConfig'
import FilterPanel from '../components/filters/FilterPanel.vue'
import StatCard from '../components/cards/StatCard.vue'
import EChart from '../components/charts/EChart.vue'
import StatusBadge from '../components/StatusBadge.vue'

const store = useDashboardStore()
const { filteredRecords } = storeToRefs(store)
const number = new Intl.NumberFormat('id-ID')
const aggregates = computed(() => aggregateRegencies(filteredRecords.value))
const provinces = computed(() => new Set(filteredRecords.value.map((item) => item.province)).size)
const currentRegencies = computed(() => aggregates.value.filter((item) => item.status === 'above_2021').length)
const attentionRegencies = computed(() => aggregates.value.filter((item) => ['below_2021', 'year_2021'].includes(item.status)).length)

const provinceRows = computed(() => {
  const grouped = new Map<string, ReturnType<typeof aggregateRegencies>>()
  aggregates.value.forEach((item) => grouped.set(item.province, [...(grouped.get(item.province) ?? []), item]))
  return [...grouped.entries()].map(([province, rows]) => ({
    province,
    below: rows.filter((row) => row.status === 'below_2021').length,
    equal: rows.filter((row) => row.status === 'year_2021').length,
    above: rows.filter((row) => row.status === 'above_2021').length,
    unknown: rows.filter((row) => row.status === 'unknown').length,
  })).sort((a, b) => b.below - a.below || a.province.localeCompare(b.province, 'id')).slice(0, 15)
})

const statusChart = computed<EChartsOption>(() => ({
  color: ['#da1e28', '#f1c21b', '#24a148', '#8d8d8d'],
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { top: 0, textStyle: { color: '#525252', fontFamily: 'IBM Plex Sans' } },
  grid: { top: 44, left: 115, right: 20, bottom: 20 },
  xAxis: { type: 'value', splitLine: { lineStyle: { color: '#e0e0e0' } } },
  yAxis: { type: 'category', data: provinceRows.value.map((item) => item.province).reverse(), axisLabel: { width: 100, overflow: 'truncate' } },
  series: [
    { name: '< 2021', type: 'bar', stack: 'status', data: provinceRows.value.map((item) => item.below).reverse() },
    { name: '= 2021', type: 'bar', stack: 'status', data: provinceRows.value.map((item) => item.equal).reverse() },
    { name: '> 2021', type: 'bar', stack: 'status', data: provinceRows.value.map((item) => item.above).reverse() },
    { name: 'Tidak diketahui', type: 'bar', stack: 'status', data: provinceRows.value.map((item) => item.unknown).reverse() },
  ],
}))

const categoryCounts = computed(() => ({
  below_2021: filteredRecords.value.filter((item) => item.yearCategory === 'below_2021').length,
  year_2021: filteredRecords.value.filter((item) => item.yearCategory === 'year_2021').length,
  above_2021: filteredRecords.value.filter((item) => item.yearCategory === 'above_2021').length,
  unknown: filteredRecords.value.filter((item) => item.yearCategory === 'unknown').length,
}))
const compositionChart = computed<EChartsOption>(() =>
  createCompositionPieChart(categoryCounts.value),
)
const years = computed(() => {
  const counts = new Map<number, number>()
  filteredRecords.value.forEach((item) => { if (item.year) counts.set(item.year, (counts.get(item.year) ?? 0) + 1) })
  return [...counts.entries()].sort((a, b) => a[0] - b[0])
})
const yearChart = computed<EChartsOption>(() => ({
  color: ['#0f62fe'], tooltip: { trigger: 'axis' }, grid: { top: 20, left: 50, right: 20, bottom: 36 },
  xAxis: { type: 'category', data: years.value.map(([year]) => year), axisTick: { show: false } },
  yAxis: { type: 'value', splitLine: { lineStyle: { color: '#e0e0e0' } } },
  series: [{ type: 'bar', data: years.value.map(([, count]) => count), barMaxWidth: 36, itemStyle: { color: (params: any) => Number(years.value[params.dataIndex]?.[0]) < 2021 ? '#da1e28' : Number(years.value[params.dataIndex]?.[0]) === 2021 ? '#f1c21b' : '#24a148' } }],
}))
const priorities = computed(() => [...aggregates.value].sort((a, b) => b.below_2021 - a.below_2021 || b.year_2021 - a.year_2021 || b.unknown - a.unknown).slice(0, 10))
</script>

<template>
  <div class="page">
    <section class="page-intro"><div><span class="eyebrow">GAMBARAN UMUM</span><h2>Kondisi kemutakhiran data lokasi</h2><p>Pantau wilayah yang masih menggunakan data tahun 2021 atau lebih lama.</p></div><div class="data-pill"><i />{{ number.format(filteredRecords.length) }} lokasi aktif</div></section>
    <FilterPanel compact />
    <section class="stat-grid stat-grid--five">
      <StatCard label="Provinsi" :value="number.format(provinces)" note="Dalam hasil filter" :icon="MapPin" />
      <StatCard label="Kabupaten/Kota" :value="number.format(aggregates.length)" note="Unit wilayah unik" :icon="Building2" />
      <StatCard label="Total lokasi" :value="number.format(filteredRecords.length)" note="W1, W2, dan W3" :icon="Database" />
      <StatCard label="Perlu perhatian" :value="number.format(attentionRegencies)" note="Masih memiliki data ≤ 2021" tone="red" :icon="ShieldAlert" />
      <StatCard label="Seluruhnya > 2021" :value="number.format(currentRegencies)" note="Berdasarkan lokasi valid" tone="green" :icon="ShieldCheck" />
    </section>
    <section class="dashboard-grid dashboard-grid--wide">
      <article class="panel panel--span-2"><div class="panel__header"><div><span class="eyebrow">STATUS WILAYAH</span><h3>Kabupaten/kota per provinsi</h3></div><span class="panel__hint">15 provinsi prioritas</span></div><EChart :option="statusChart" :height="430" /></article>
      <article class="panel"><div class="panel__header"><div><span class="eyebrow">KOMPOSISI LOKASI</span><h3>Kategori tahun</h3></div></div><EChart :option="compositionChart" :height="360" /></article>
      <article class="panel panel--span-3"><div class="panel__header"><div><span class="eyebrow">DISTRIBUSI WAKTU</span><h3>Jumlah lokasi menurut tahun data</h3></div></div><EChart :option="yearChart" :height="270" /></article>
    </section>
    <article class="panel table-panel"><div class="panel__header"><div><span class="eyebrow">PRIORITAS PEMBARUAN</span><h3>10 kabupaten/kota yang perlu diperhatikan</h3></div><RouterLink to="/provinsi" class="text-link">Lihat analisis lengkap →</RouterLink></div>
      <div class="table-wrap"><table><thead><tr><th>#</th><th>Provinsi</th><th>Kabupaten/Kota</th><th class="number-cell">Total</th><th class="number-cell">&lt; 2021</th><th class="number-cell">= 2021</th><th class="number-cell">&gt; 2021</th><th>Status</th></tr></thead><tbody><tr v-for="(row, index) in priorities" :key="`${row.province}-${row.regency}`"><td>{{ index + 1 }}</td><td>{{ row.province }}</td><td><strong>{{ row.regency }}</strong></td><td class="number-cell">{{ number.format(row.total) }}</td><td class="number-cell danger-text">{{ number.format(row.below_2021) }}</td><td class="number-cell warning-text">{{ number.format(row.year_2021) }}</td><td class="number-cell success-text">{{ number.format(row.above_2021) }}</td><td><StatusBadge :status="row.status" /></td></tr></tbody></table></div>
    </article>
  </div>
</template>
