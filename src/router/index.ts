import { createRouter, createWebHistory } from 'vue-router'
import SummaryView from '../views/SummaryView.vue'
import ProvinceView from '../views/ProvinceView.vue'
import DetailView from '../views/DetailView.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'summary', component: SummaryView },
    { path: '/provinsi', name: 'province', component: ProvinceView },
    { path: '/detail', name: 'detail', component: DetailView },
  ],
})
