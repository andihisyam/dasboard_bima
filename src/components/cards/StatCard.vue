<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{ label: string; value: string | number; note?: string; tone?: 'blue' | 'red' | 'yellow' | 'green' | 'gray'; icon?: Component }>()
</script>

<template>
  <article class="stat-card" :class="`stat-card--${tone ?? 'blue'}`">
    <div class="stat-card__top"><span>{{ label }}</span><component :is="icon" v-if="icon" :size="19" /></div>
    <strong>{{ value }}</strong>
    <small v-if="note">{{ note }}</small>
  </article>
</template>
