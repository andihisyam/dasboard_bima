import type { EChartsOption } from 'echarts'

export interface PieChartData {
  needsUpdate: number
  updated: number
  unknown: number
}

export interface RegencyStatusData {
  clean: number
  mixed: number
}

export function createCompositionPieChart(counts: PieChartData, options?: {
  showLabel?: boolean
  radius?: [string | number, string | number]
  center?: [string | number, string | number]
  legendPosition?: 'bottom' | 'vertical-right'
}): EChartsOption {
  const {
    showLabel = true,
    radius = ['45%', '65%'],
    center = ['50%', '46%'],
    legendPosition = 'bottom',
  } = options ?? {}

  return {
    color: ['#da1e28', '#f1c21b', '#8d8d8d'],
    tooltip: { trigger: 'item', formatter: '{b}<br/><strong>{c}</strong> lokasi ({d}%)' },
    legend: legendPosition === 'bottom'
      ? { bottom: 0, icon: 'circle', textStyle: { fontSize: 11 }, itemGap: 20 }
      : { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      type: 'pie',
      radius,
      center,
      label: showLabel
        ? { show: true, formatter: '{c}\n({d}%)', fontWeight: 600, fontSize: 12, lineHeight: 18 }
        : { show: false },
      labelLine: showLabel
        ? { show: true, length: 12, length2: 16, smooth: true }
        : undefined,
      data: [
        { name: 'Perlu pemutakhiran', value: counts.needsUpdate },
        { name: 'Sudah pemutakhiran', value: counts.updated },
        { name: 'Belum diketahui', value: counts.unknown },
      ],
    }],
  }
}

export function createRegencyStatusPieChart(counts: RegencyStatusData): EChartsOption {
  return {
    color: ['#24a148', '#f1c21b'],
    tooltip: { trigger: 'item', formatter: '{b}<br/><strong>{c}</strong> kab/kota ({d}%)' },
    legend: { bottom: 0, icon: 'circle', textStyle: { fontSize: 11 }, itemGap: 20 },
    series: [{
      type: 'pie',
      radius: ['45%', '65%'],
      center: ['50%', '46%'],
      label: { show: true, formatter: '{c}\n({d}%)', fontWeight: 600, fontSize: 12, lineHeight: 18 },
      labelLine: { show: true, length: 12, length2: 16, smooth: true },
      data: [
        { name: 'Sudah pemutakhiran', value: counts.clean },
        { name: 'Perlu pemutakhiran', value: counts.mixed },
      ],
    }],
  }
}
