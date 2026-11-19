<script setup lang="ts">
import { computed } from 'vue'
import { X } from '@lucide/vue'
import type { RegencyAggregate } from '../types/data'

interface Props {
  open: boolean
  regencies: RegencyAggregate[]
  status: 'clean' | 'mixed'
}

defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const number = new Intl.NumberFormat('id-ID')
const title = computed(() => (props.status === 'clean' ? 'Kabupaten/Kota Bersih' : 'Kabupaten/Kota Campur'))
const sorted = computed(() => [...props.regencies].sort((a, b) => a.regency.localeCompare(b.regency, 'id')))

const props = defineProps<Props>()
</script>

<template>
  <div v-if="open" class="modal-overlay" @click="emit('close')">
    <div class="modal-drawer" @click.stop>
      <div class="modal-header">
        <h2>{{ title }}</h2>
        <button class="modal-close" @click="emit('close')"><X :size="20" /></button>
      </div>
      <div class="modal-content">
        <div class="regency-list">
          <div v-for="regency in sorted" :key="`${regency.province}-${regency.regency}`" class="regency-item">
            <div class="regency-name">{{ regency.regency }}</div>
            <div class="regency-count">{{ number.format(regency.total) }} lokasi</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: flex-end;
  z-index: 1000;
}

.modal-drawer {
  width: 400px;
  height: 100%;
  background: white;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #161616;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #525252;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.modal-close:hover {
  background: #f4f4f4;
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.regency-list {
  display: flex;
  flex-direction: column;
}

.regency-item {
  padding: 12px 20px;
  border-bottom: 1px solid #f4f4f4;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s;
}

.regency-item:hover {
  background: #f9f9f9;
}

.regency-name {
  font-size: 14px;
  font-weight: 500;
  color: #161616;
}

.regency-count {
  font-size: 12px;
  color: #8d8d8d;
}

@media (max-width: 768px) {
  .modal-drawer {
    width: 100%;
  }
}
</style>
