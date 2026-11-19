import type { EChartsOption } from 'echarts'

export interface PieChartData {
  below_2021: number
  year_2021: number
  above_2021: number
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
    color: ['#da1e28', '#f1c21b', '#24a148', '#8d8d8d'],
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
        { name: 'Di bawah 2021', value: counts.below_2021 },
        { name: 'Tahun 2021', value: counts.year_2021 },
        { name: 'Di atas 2021', value: counts.above_2021 },
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
        { name: 'Bersih', value: counts.clean },
        { name: 'Campur', value: counts.mixed },
      ],
    }],
  }
}
