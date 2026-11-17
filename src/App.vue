<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { BarChart3, Building2, Database, MapPinned, Menu, X } from '@lucide/vue'
import { useDashboardStore } from './stores/dashboard'

const store = useDashboardStore()
const route = useRoute()
const mobileOpen = ref(false)
const title = computed(() => ({ summary: 'Ringkasan nasional', province: 'Analisis provinsi', detail: 'Detail lokasi' }[String(route.name)] ?? 'Dashboard'))
onMounted(store.load)
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar" :class="{ 'sidebar--open': mobileOpen }">
      <div class="brand"><div class="brand__mark"><BarChart3 :size="22" /></div><div><strong>MONEV</strong><span>Kemutakhiran Data</span></div></div>
      <button class="sidebar__close" @click="mobileOpen = false"><X /></button>
      <nav>
        <span class="nav-label">ANALISIS</span>
        <RouterLink to="/" @click="mobileOpen=false"><BarChart3 :size="19"/><span>Ringkasan</span></RouterLink>
        <RouterLink to="/provinsi" @click="mobileOpen=false"><Building2 :size="19"/><span>Analisis Provinsi</span></RouterLink>
        <RouterLink to="/detail" @click="mobileOpen=false"><MapPinned :size="19"/><span>Detail Lokasi</span></RouterLink>
      </nav>
      <div class="sidebar__meta"><Database :size="18"/><div><span>Sumber data</span><strong>W1 · W2 · W3</strong></div></div>
    </aside>
    <div class="content-shell">
      <header class="topbar">
        <button class="menu-button" @click="mobileOpen=true"><Menu /></button>
        <div><span class="topbar__kicker">DASHBOARD MONITORING</span><h1>{{ title }}</h1></div>
        <div class="topbar__status"><i /> Data terhubung</div>
      </header>
      <main>
        <div v-if="store.loading" class="state-panel"><div class="loader"/><h2>Memuat data monitoring</h2></div>
        <div v-else-if="store.error" class="state-panel state-panel--error"><h2>Data tidak dapat dimuat</h2><p>{{ store.error }}</p><button class="primary-button" @click="store.load">Coba lagi</button></div>
        <RouterView v-else />
      </main>
    </div>
  </div>
</template>
