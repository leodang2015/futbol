<template>
  <div class="fixture-view">
    <!-- Header de Fixture con Filtro de Jornada -->
    <q-card flat bordered class="bg-white rounded-borders q-mb-md">
      <q-card-section class="row items-center justify-between q-py-md">
        <div class="row items-center">
          <q-icon :name="matCalendarMonth" color="primary" size="24px" class="q-mr-sm" />
          <div>
            <div class="text-subtitle1 text-weight-bold text-dark">Fixture & Calendario Oficial</div>
            <div class="text-caption text-grey-6">Resultados de encuentros y fechas programadas</div>
          </div>
        </div>

        <div class="row items-center q-gutter-sm">
          <q-select
            v-model="fecha"
            :options="opciones"
            emit-value
            map-options
            dense
            outlined
            bg-color="white"
            style="min-width: 190px"
          >
            <template #prepend>
              <q-icon :name="matEvent" size="18px" color="grey-6" />
            </template>
          </q-select>
        </div>
      </q-card-section>
    </q-card>

    <!-- Lista de Partidos en Tarjetas de Marcador -->
    <div class="row q-col-gutter-md">
      <div v-for="p in lista" :key="p.id" class="col-12 col-md-6">
        <q-card flat bordered class="match-card bg-white rounded-borders overflow-hidden">
          <!-- Franja superior con Jornada y Estado -->
          <div class="match-card-top row items-center justify-between q-px-md q-py-xs bg-slate-50 border-b">
            <span class="text-caption text-weight-bold text-primary font-mono">
              JORNADA {{ p.fecha }}
            </span>
            <div class="row items-center q-gutter-xs">
              <span
                class="status-badge"
                :class="finalizado(p) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'"
              >
                {{ finalizado(p) ? 'Finalizado' : 'Programado' }}
              </span>
            </div>
          </div>

          <!-- Enfrentamiento y Marcador -->
          <q-card-section class="q-py-md q-px-lg">
            <div class="row items-center justify-between no-wrap">
              <!-- Equipo Local -->
              <div class="team-side col-5 row items-center no-wrap">
                <span class="club-crest-dot q-mr-sm" :style="{ background: color(p.localId) }" />
                <span class="team-name text-weight-bold text-dark ellipsis" :title="nombre(p.localId)">
                  {{ nombre(p.localId) }}
                </span>
              </div>

              <!-- Marcador Central -->
              <div class="col-2 text-center">
                <div class="score-display font-mono">
                  <template v-if="finalizado(p)">
                    <span class="score-num">{{ p.golesLocal }}</span>
                    <span class="score-divider">-</span>
                    <span class="score-num">{{ p.golesVisitante }}</span>
                  </template>
                  <template v-else>
                    <span class="score-vs text-caption text-grey-5 font-bold">VS</span>
                  </template>
                </div>
              </div>

              <!-- Equipo Visitante -->
              <div class="team-side col-5 row items-center justify-end no-wrap text-right">
                <span class="team-name text-weight-bold text-dark ellipsis" :title="nombre(p.visitanteId)">
                  {{ nombre(p.visitanteId) }}
                </span>
                <span class="club-crest-dot q-ml-sm" :style="{ background: color(p.visitanteId) }" />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Estado Vacío cuando no hay partidos -->
      <div v-if="!lista.length" class="col-12">
        <q-card flat bordered class="bg-white rounded-borders q-pa-xl text-center">
          <q-icon :name="matEventBusy" size="48px" color="grey-4" class="q-mb-md" />
          <div class="text-subtitle1 text-weight-bold text-dark q-mb-xs">No hay partidos registrados</div>
          <p class="text-grey-6 text-body2 text-wrap-balance max-w-md q-mx-auto q-mb-md">
            {{ fecha === 'todos' ? 'Aún no se han computado encuentros en la base de datos de MongoDB Atlas.' : `No hay partidos registrados en la Fecha ${fecha}.` }}
          </p>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTorneo } from '../torneo.js'
import { matCalendarMonth, matEvent, matEventBusy } from '@quasar/extras/material-icons'

const store = useTorneo()
const fecha = ref('todos')

const opciones = computed(() => [
  { label: 'Todas las jornadas', value: 'todos' },
  ...store.fechas.map(f => ({ label: `Jornada ${f}`, value: f }))
])

const lista = computed(() =>
  store.partidos.filter(p => fecha.value === 'todos' || p.fecha === fecha.value)
)

const finalizado = (p) => ['jugado', 'finalizado'].includes(p.estado)
const nombre = (id) => store.equipoPorId(id)?.nombre ?? 'Club no asignado'
const color = (id) => store.equipoPorId(id)?.color || store.equipoPorId(id)?.escudocolor || '#059669'
</script>

<style scoped>
.match-card {
  border: 1px solid #e2e8f0;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.match-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.match-card-top {
  font-size: 0.72rem;
  letter-spacing: 0.05em;
}
.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
}
.club-crest-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-block;
}
.team-name {
  font-size: 0.92rem;
}
.score-display {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #0f172a;
  color: #ffffff;
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 800;
  font-size: 1.05rem;
  min-width: 64px;
}
.score-divider {
  margin: 0 4px;
  color: #94a3b8;
}
.score-vs {
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}
.bg-slate-50 {
  background-color: #f8fafc;
}
.border-b {
  border-bottom: 1px solid #e2e8f0;
}
.text-wrap-balance {
  text-wrap: balance;
}
.max-w-md {
  max-width: 28rem;
}
</style>
