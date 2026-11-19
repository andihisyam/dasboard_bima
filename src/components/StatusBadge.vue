<script setup lang="ts">
import type { YearCategory } from '../types/data'

const labels: Record<YearCategory, string> = {
  needsUpdate: 'Perlu pemutakhiran',
  updated: 'Sudah pemutakhiran',
  unknown: 'Belum diketahui',
}
defineProps<{ status: YearCategory }>()
</script>

<template><span class="status-badge" :class="`status-badge--${status}`"><i />{{ labels[status] }}</span></template>
