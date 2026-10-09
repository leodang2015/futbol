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

    <!-- BANNER DE PRIVACIDAD / VISTA: Modo Jugador o Entrenador -->
    <q-banner
      v-if="(store.esJugador || store.esEntrenador) && store.miEquipoId"
      dense
      rounded
      class="bg-indigo-1 text-indigo-10 q-mb-md q-py-sm q-px-md border border-indigo-2 shadow-1"
    >
      <template #avatar>
        <q-icon :name="matSportsSoccer" size="24px" color="indigo-8" />
      </template>
      <div class="row items-center justify-between no-wrap">
        <div>
          <div class="text-caption text-weight-bolder">
            ⚽ Calendario Oficial · {{ store.miEquipo?.nombre || 'Tu Club' }}
          </div>
          <div class="text-caption text-grey-8">
            Puedes consultar todos los partidos del campeonato o alternar para ver solo los de tu equipo.
          </div>
        </div>
        <q-btn-toggle
          v-model="filtroVistaFixture"
          no-caps
          dense
          unelevated
          size="xs"
          color="white"
          text-color="indigo-9"
          toggle-color="indigo-9"
          toggle-text-color="white"
          class="q-ml-sm shadow-1"
          :options="[
            { label: 'Todos los Partidos', value: 'todos' },
            { label: 'Solo Mi Club', value: 'mio' }
          ]"
        />
      </div>
    </q-banner>

    <!-- TARJETA DESTACADA: Próximo Partido de tu Equipo -->
    <q-card
      v-if="(store.esJugador || store.esEntrenador) && proximoPartido"
      flat
      bordered
      class="bg-emerald-50 border border-emerald-4 rounded-borders q-mb-md q-pa-md shadow-2"
    >
      <div class="row items-center justify-between no-wrap q-col-gutter-md">
        <div class="row items-center q-gutter-md">
          <q-avatar size="44px" color="emerald-7" text-color="white" class="text-weight-bold text-h6 shadow-1">
            ⚔️
          </q-avatar>
          <div>
            <div class="text-caption text-uppercase text-weight-bolder text-emerald-9">
              Próximo Partido Programado de tu Equipo
            </div>
            <div class="text-subtitle1 text-weight-bolder text-slate-900 row items-center q-gutter-xs">
              <span>{{ store.miEquipo?.nombre }}</span>
              <span class="text-grey-6 text-caption text-weight-bold">VS</span>
              <span class="text-positive">{{ rivalProximo?.nombre || 'Rival Oficial' }}</span>
            </div>
            <div class="text-caption text-grey-8">
              Jornada {{ proximoPartido.fecha }} · Tu equipo jugará contra <strong>{{ rivalProximo?.nombre || 'el rival asignado' }}</strong>.
              <span v-if="rivalProximo?.capitan" class="q-ml-xs text-grey-7 font-mono font-11">
                (Capitán rival: {{ rivalProximo.capitan }} Ⓒ)
              </span>
            </div>
          </div>
        </div>
        <q-badge color="positive" text-color="white" label="Tu Próximo Encuentro" class="text-weight-bold font-11 q-px-sm q-py-xs" />
      </div>
    </q-card>

    <!-- Lista de Partidos en Tarjetas de Marcador -->
    <div class="row q-col-gutter-md">
      <div v-for="p in lista" :key="p.id" class="col-12 col-md-6">
        <q-card flat bordered class="match-card bg-white rounded-borders overflow-hidden">
          <!-- Franja superior con Jornada y Estado -->
          <div class="match-card-top row items-center justify-between q-px-md q-py-xs bg-slate-50 border-b">
            <div class="row items-center q-gutter-xs">
              <span class="text-caption text-weight-bold text-primary font-mono">
                JORNADA {{ p.fecha }}
              </span>
              <span v-if="p.fechaHora" class="text-caption text-grey-7 font-mono font-10">
                · {{ formatearFecha(p.fechaHora) }}
              </span>
            </div>
            <div class="row items-center q-gutter-xs">
              <span
                class="status-badge"
                :class="statusBadgeClass(p)"
              >
                {{ statusBadgeLabel(p) }}
              </span>
            </div>
          </div>

          <!-- Enfrentamiento y Marcador -->
          <q-card-section class="q-py-md q-px-lg">
            <div class="row items-center justify-between no-wrap">
              <!-- Equipo Local -->
              <div class="team-side col-5 row items-center no-wrap">
                <img
                  v-if="crestUrl(p.localId)"
                  :src="crestUrl(p.localId)"
                  alt="Escudo"
                  class="club-fixture-crest q-mr-xs"
                />
                <span v-else-if="crestFigura(p.localId)" class="q-mr-xs font-14">{{ crestFigura(p.localId) }}</span>
                <span v-else class="club-crest-dot q-mr-sm" :style="{ background: color(p.localId) }" />
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
                <img
                  v-if="crestUrl(p.visitanteId)"
                  :src="crestUrl(p.visitanteId)"
                  alt="Escudo"
                  class="club-fixture-crest q-ml-xs"
                />
                <span v-else-if="crestFigura(p.visitanteId)" class="q-ml-xs font-14">{{ crestFigura(p.visitanteId) }}</span>
                <span v-else class="club-crest-dot q-ml-sm" :style="{ background: color(p.visitanteId) }" />
              </div>
            </div>
          </q-card-section>

          <!-- Detalle de Goleadores y Asistencias (Solo en Finalizados) -->
          <div v-if="finalizado(p) && p.goleadores && p.goleadores.length" class="q-px-md q-py-xs bg-slate-50 border-t border-slate-200">
            <div class="row items-center justify-between no-wrap q-mb-xs">
              <span class="text-caption text-weight-bolder text-emerald-9 font-11">
                ⚽ Goleadores y Asistencias Oficiales
              </span>
              <span class="text-caption text-grey-6 font-mono font-10">Acta Final</span>
            </div>
            <div class="row q-col-gutter-xs">
              <div
                v-for="(g, gIdx) in p.goleadores"
                :key="gIdx"
                class="col-12 col-sm-6"
              >
                <div class="bg-white q-pa-xs rounded-borders border border-slate-200 text-caption font-11">
                  <div class="row items-center justify-between no-wrap">
                    <div class="row items-center no-wrap q-gutter-xs ellipsis">
                      <span class="text-weight-bold text-dark ellipsis">⚽ {{ g.nombre }}</span>
                      <span v-if="g.dorsal" class="text-grey-6 font-mono font-10">#{{ g.dorsal }}</span>
                    </div>
                    <span class="text-positive text-weight-bolder font-mono font-11 q-ml-xs">
                      {{ g.minuto ? `${g.minuto}'` : 'Gol' }}
                    </span>
                  </div>
                  <div v-if="g.asistenteNombre" class="text-grey-7 font-mono font-10 row items-center q-gutter-xs q-mt-xs">
                    <span class="text-indigo-8">🎯 Asistencia:</span>
                    <span class="text-weight-medium text-slate-900">{{ g.asistenteNombre }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
import { matCalendarMonth, matEvent, matEventBusy, matSportsSoccer } from '@quasar/extras/material-icons'

const store = useTorneo()
const fecha = ref('todos')
const filtroVistaFixture = ref('todos')

const opciones = computed(() => [
  { label: 'Todas las jornadas', value: 'todos' },
  ...store.fechas.map(f => ({ label: `Jornada ${f}`, value: f }))
])

const finalizado = (p) => ['jugado', 'finalizado'].includes(String(p?.estado || '').toLowerCase())

const statusBadgeLabel = (p) => {
  const est = String(p?.estado || '').toLowerCase()
  if (['jugado', 'finalizado'].includes(est)) return 'Finalizado'
  if (est.includes('preparaci') || est.includes('proceso')) return 'En Preparación'
  if (est.includes('confirmar')) return 'Por Confirmar'
  return 'Programado'
}

const statusBadgeClass = (p) => {
  const est = String(p?.estado || '').toLowerCase()
  if (['jugado', 'finalizado'].includes(est)) return 'bg-emerald-100 text-emerald-800 border border-emerald-300'
  if (est.includes('preparaci') || est.includes('proceso')) return 'bg-amber-100 text-amber-900 border border-amber-300'
  if (est.includes('confirmar')) return 'bg-sky-100 text-sky-800 border border-sky-300'
  return 'bg-slate-100 text-slate-700 border border-slate-300'
}
const nombre = (id) => store.equipoPorId(id)?.nombre ?? 'Club no asignado'
const color = (id) => store.equipoPorId(id)?.color || store.equipoPorId(id)?.escudocolor || '#059669'
const crestUrl = (id) => store.equipoPorId(id)?.escudoUrl
const crestFigura = (id) => store.equipoPorId(id)?.escudoFigura

const lista = computed(() => {
  let list = store.partidos.filter(p => fecha.value === 'todos' || p.fecha === fecha.value)

  if ((store.esJugador || store.esEntrenador) && filtroVistaFixture.value === 'mio') {
    const miId = String(store.miEquipoId || '').trim()
    if (miId) {
      list = list.filter(p => String(p.localId || '').trim() === miId || String(p.visitanteId || '').trim() === miId)
    }
  }

  return list
})

const proximoPartido = computed(() => {
  if ((!store.esJugador && !store.esEntrenador) || !store.miEquipoId) return null
  const miId = String(store.miEquipoId || '').trim()
  return store.partidos.find(p =>
    !finalizado(p) && (String(p.localId || '').trim() === miId || String(p.visitanteId || '').trim() === miId)
  )
})

const rivalProximo = computed(() => {
  if (!proximoPartido.value) return null
  const miId = String(store.miEquipoId || '').trim()
  const esLocal = String(proximoPartido.value.localId || '').trim() === miId
  const rivalId = esLocal ? proximoPartido.value.visitanteId : proximoPartido.value.localId
  return store.equipoPorId(rivalId)
})

function formatearFecha(f) {
  if (!f) return ''
  try {
    const d = new Date(f)
    return d.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch (_) {
    return ''
  }
}
</script>

<style scoped>
.club-fixture-crest {
  width: 20px;
  height: 20px;
  object-fit: contain;
  border-radius: 4px;
}
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
