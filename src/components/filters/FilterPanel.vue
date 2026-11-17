<script setup lang="ts">
import { RotateCcw, Search } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '../../stores/dashboard'

defineProps<{ detail?: boolean; compact?: boolean }>()
const store = useDashboardStore()
const { filters, options } = storeToRefs(store)
</script>

<template>
  <section class="filter-panel" :class="{ 'filter-panel--compact': compact }">
    <div class="filter-panel__heading">
      <div><span class="eyebrow">FILTER DATA</span><h2>Pilih lingkup analisis</h2></div>
      <button class="ghost-button" type="button" @click="store.reset"><RotateCcw :size="16" /> Reset</button>
    </div>
    <div class="filter-grid">
      <label><span>Sumber</span><select v-model="filters.source"><option value="ALL">Semua W1–W3</option><option value="W1">W1</option><option value="W2">W2</option><option value="W3">W3</option></select></label>
      <label><span>Provinsi</span><select :value="filters.province" @change="store.setProvince(($event.target as HTMLSelectElement).value)"><option value="ALL">Semua provinsi</option><option v-for="item in options.provinces" :key="item" :value="item">{{ item }}</option></select></label>
      <label><span>Kabupaten/Kota</span><select :value="filters.regency" @change="store.setRegency(($event.target as HTMLSelectElement).value)"><option value="ALL">Semua kabupaten/kota</option><option v-for="item in options.regencies" :key="item" :value="item">{{ item }}</option></select></label>
      <label v-if="detail"><span>Kecamatan</span><select v-model="filters.district"><option value="ALL">Semua kecamatan</option><option v-for="item in options.districts" :key="item" :value="item">{{ item }}</option></select></label>
      <label><span>Kategori tahun</span><select v-model="filters.category"><option value="ALL">Semua kategori</option><option value="below_2021">Di bawah 2021</option><option value="year_2021">Tahun 2021</option><option value="above_2021">Di atas 2021</option><option value="unknown">Belum diketahui</option></select></label>
      <label><span>Tahun aktual</span><select v-model="filters.year"><option value="ALL">Semua tahun</option><option v-for="year in options.years" :key="year" :value="year">{{ year }}</option></select></label>
      <label v-if="detail" class="search-field"><span>Cari lokasi</span><div><Search :size="17"/><input v-model="filters.search" placeholder="Nama lokasi/kecamatan" /></div></label>
    </div>
  </section>
</template>
