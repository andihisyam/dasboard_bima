<script setup lang="ts">
import type { YearCategory } from '../types/data'

const labels: Record<YearCategory, string> = {
  below_2021: 'Di bawah 2021', year_2021: 'Tahun 2021', above_2021: 'Di atas 2021', unknown: 'Belum diketahui',
}
defineProps<{ status: YearCategory }>()
</script>

<template><span class="status-badge" :class="`status-badge--${status}`"><i />{{ labels[status] }}</span></template>
