<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { Building2, CircleAlert, CircleCheck, Clock3 } from '@lucide/vue'
import type { EChartsOption } from 'echarts'
import { useDashboardStore } from '../stores/dashboard'
import { aggregateRegencies } from '../utils/analytics'
import FilterPanel from '../components/filters/FilterPanel.vue'
import StatCard from '../components/cards/StatCard.vue'
import EChart from '../components/charts/EChart.vue'
import StatusBadge from '../components/StatusBadge.vue'

const store = useDashboardStore()
const { filteredRecords, filters } = storeToRefs(store)
const number = new Intl.NumberFormat('id-ID')
const rows = computed(() => aggregateRegencies(filteredRecords.value))
const title = computed(() => filters.value.province === 'ALL' ? 'Semua provinsi' : filters.value.province)
const countStatus = (status: string) => rows.value.filter((item) => item.status === status).length
const barRows = computed(() => [...rows.value].sort((a, b) => b.below_2021 - a.below_2021 || b.total - a.total).slice(0, 20))
const stackedChart = computed<EChartsOption>(() => ({
  color: ['#da1e28', '#f1c21b', '#24a148', '#8d8d8d'], tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } }, legend: { top: 0 },
  grid: { top: 45, left: 145, right: 20, bottom: 25 }, xAxis: { type: 'value', splitLine: { lineStyle: { color: '#e0e0e0' } } },
  yAxis: { type: 'category', data: barRows.value.map((row) => row.regency).reverse(), axisLabel: { width: 130, overflow: 'truncate' } },
  series: [
    { name: '< 2021', type: 'bar', stack: 'all', data: barRows.value.map((row) => row.below_2021).reverse() },
    { name: '= 2021', type: 'bar', stack: 'all', data: barRows.value.map((row) => row.year_2021).reverse() },
    { name: '> 2021', type: 'bar', stack: 'all', data: barRows.value.map((row) => row.above_2021).reverse() },
    { name: 'Tidak diketahui', type: 'bar', stack: 'all', data: barRows.value.map((row) => row.unknown).reverse() },
  ],
}))
const percentageChart = computed<EChartsOption>(() => ({
  color: ['#24a148'], tooltip: { trigger: 'axis', formatter: (items: any) => `${items[0].name}<br/><strong>${items[0].value.toFixed(1)}%</strong> lokasi > 2021` },
  grid: { top: 15, left: 145, right: 45, bottom: 25 }, xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' }, splitLine: { lineStyle: { color: '#e0e0e0' } } },
  yAxis: { type: 'category', data: barRows.value.map((row) => row.regency).reverse(), axisLabel: { width: 130, overflow: 'truncate' } },
  series: [{ type: 'bar', data: barRows.value.map((row) => Number(row.currentPercentage.toFixed(1))).reverse(), barMaxWidth: 18, label: { show: true, position: 'right', formatter: '{c}%' } }],
}))
const years = computed(() => {
  const counts = new Map<number, number>()
  filteredRecords.value.forEach((item) => { if (item.year) counts.set(item.year, (counts.get(item.year) ?? 0) + 1) })
  return [...counts.entries()].sort((a, b) => a[0] - b[0])
})
const trendChart = computed<EChartsOption>(() => ({
  color: ['#0f62fe'], tooltip: { trigger: 'axis' }, grid: { top: 20, left: 50, right: 20, bottom: 35 },
  xAxis: { type: 'category', data: years.value.map(([year]) => year) }, yAxis: { type: 'value', splitLine: { lineStyle: { color: '#e0e0e0' } } },
  series: [{ type: 'line', data: years.value.map(([, count]) => count), smooth: true, symbolSize: 8, areaStyle: { color: 'rgba(15,98,254,.12)' }, lineStyle: { width: 3 } }],
}))
</script>

<template><div class="page">
  <section class="page-intro"><div><span class="eyebrow">ANALISIS WILAYAH</span><h2>{{ title }}</h2><p>Bandingkan kabupaten/kota dan temukan lokasi yang membutuhkan pembaruan.</p></div><div class="data-pill"><i />{{ number.format(filteredRecords.length) }} lokasi</div></section>
  <FilterPanel />
  <section class="stat-grid" :class="countStatus('unknown') ? 'stat-grid--five' : 'stat-grid--four'">
    <StatCard label="Kabupaten/Kota" :value="number.format(rows.length)" note="Dalam filter aktif" :icon="Building2" />
    <StatCard label="Status < 2021" :value="number.format(countStatus('below_2021'))" note="Prioritas utama" tone="red" :icon="CircleAlert" />
    <StatCard label="Status 2021" :value="number.format(countStatus('year_2021'))" note="Perlu perhatian" tone="yellow" :icon="Clock3" />
    <StatCard label="Status > 2021" :value="number.format(countStatus('above_2021'))" note="Seluruh lokasi valid terkini" tone="green" :icon="CircleCheck" />
    <StatCard v-if="countStatus('unknown')" label="Belum diketahui" :value="number.format(countStatus('unknown'))" note="Tahun perlu dilengkapi" tone="gray" :icon="CircleAlert" />
  </section>
  <section class="dashboard-grid dashboard-grid--two">
    <article class="panel"><div class="panel__header"><div><span class="eyebrow">KOMPOSISI</span><h3>Lokasi per kabupaten/kota</h3></div><span class="panel__hint">Maks. 20 wilayah</span></div><EChart :option="stackedChart" :height="520" /></article>
    <article class="panel"><div class="panel__header"><div><span class="eyebrow">KEMUTAKHIRAN</span><h3>Persentase lokasi di atas 2021</h3></div></div><EChart :option="percentageChart" :height="520" /></article>
    <article class="panel panel--span-2"><div class="panel__header"><div><span class="eyebrow">DISTRIBUSI TAHUN</span><h3>Persebaran tahun data pada wilayah terpilih</h3></div></div><EChart :option="trendChart" :height="260" /></article>
  </section>
  <article class="panel table-panel"><div class="panel__header"><div><span class="eyebrow">REKAP WILAYAH</span><h3>Ringkasan kabupaten/kota</h3></div><RouterLink to="/detail" class="text-link">Telusuri lokasi →</RouterLink></div><div class="table-wrap"><table><thead><tr><th>Kabupaten/Kota</th><th class="number-cell">Total</th><th class="number-cell">&lt; 2021</th><th class="number-cell">= 2021</th><th class="number-cell">&gt; 2021</th><th class="number-cell">Tidak diketahui</th><th class="number-cell">Terkini</th><th>Status</th></tr></thead><tbody><tr v-for="row in rows" :key="`${row.province}-${row.regency}`"><td><strong>{{ row.regency }}</strong><small class="cell-subtitle">{{ row.province }}</small></td><td class="number-cell">{{ number.format(row.total) }}</td><td class="number-cell danger-text">{{ number.format(row.below_2021) }}</td><td class="number-cell warning-text">{{ number.format(row.year_2021) }}</td><td class="number-cell success-text">{{ number.format(row.above_2021) }}</td><td class="number-cell">{{ number.format(row.unknown) }}</td><td class="number-cell"><strong>{{ row.currentPercentage.toFixed(1) }}%</strong></td><td><StatusBadge :status="row.status" /></td></tr></tbody></table></div></article>
</div></template>
