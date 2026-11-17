<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

const props = defineProps<{ option: EChartsOption; height?: number }>()
const element = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
const style = computed(() => ({ height: `${props.height ?? 320}px` }))

function render() {
  if (!element.value) return
  chart ??= echarts.init(element.value)
  chart.setOption(props.option, true)
}
function resize() { chart?.resize() }

onMounted(() => { render(); window.addEventListener('resize', resize) })
watch(() => props.option, render, { deep: true })
onBeforeUnmount(() => { window.removeEventListener('resize', resize); chart?.dispose() })
</script>

<template><div ref="element" class="chart" :style="style" /></template>
