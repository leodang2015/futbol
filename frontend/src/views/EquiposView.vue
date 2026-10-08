<template>
  <div class="equipos-view">
    <div class="row q-col-gutter-lg">
      <!-- Columna Izquierda: Lista de Clubes -->
      <div class="col-12 col-md-4">
        <q-card flat bordered class="bg-white rounded-borders overflow-hidden">
          <q-card-section class="q-py-md bg-slate-50 border-b">
            <div>
              <div class="text-subtitle1 text-weight-bold text-dark">Clubes del Torneo</div>
              <div class="text-caption text-grey-6">{{ clubesVisibles.length }} equipos registrados</div>
            </div>
          </q-card-section>

          <q-list separator class="club-list">
            <q-item
              v-for="e in clubesVisibles"
              :key="e.id"
              clickable
              :active="e.id === seleccionId"
              active-class="active-club-item"
              class="q-py-md"
              @click="seleccionId = e.id"
            >
              <q-item-section avatar>
                <img
                  v-if="e.escudoUrl"
                  :src="e.escudoUrl"
                  alt="Escudo"
                  class="club-list-crest shadow-sm"
                />
                <span v-else-if="e.escudoFigura" class="font-18 q-mr-xs">{{ e.escudoFigura }}</span>
                <span v-else class="club-avatar-dot shadow-sm" :style="{ background: e.color || e.escudocolor || '#059669' }" />
              </q-item-section>

              <q-item-section>
                <div class="row items-center justify-between no-wrap">
                  <div class="row items-center no-wrap ellipsis">
                    <q-item-label class="text-weight-bold text-dark ellipsis">{{ e.nombre }}</q-item-label>
                    <q-badge
                      v-if="store.esJugador && (e.id === store.miEquipoId || e._id === store.miEquipoId)"
                      color="indigo-7"
                      text-color="white"
                      size="xs"
                      class="q-ml-xs text-weight-bold"
                    >
                      Tu Club
                    </q-badge>
                  </div>
                  <q-badge
                    :color="store.equipoHabilitadoParaJugar(e.id) ? 'positive' : 'grey-7'"
                    text-color="white"
                    size="xs"
                    class="q-ml-xs text-weight-bold"
                  >
                    {{ store.cantidadJugadoresEquipo(e.id) }}/11 jug.
                  </q-badge>
                </div>
                <q-item-label caption class="text-grey-6">
                  {{ e.barriada || e.barrio || 'Sede Barrial' }} · DT: {{ e.capitan || e.tecnico || 'Sin asignar' }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-icon :name="matChevronRight" color="grey-5" size="18px" />
              </q-item-section>
            </q-item>

            <q-item v-if="!store.equipos.length" class="q-py-xl text-center">
              <q-item-section class="text-grey-6">
                <q-icon :name="matGroups" size="36px" color="grey-4" class="q-mx-auto q-mb-xs" />
                <div class="text-body2 text-weight-medium">Sin equipos registrados</div>
                <div class="text-caption q-mt-xs">Los clubes son creados automáticamente por cada entrenador al registrarse.</div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- Columna Derecha: Detalle del Club y Plantel Oficial -->
      <div class="col-12 col-md-8">
        <q-card flat bordered class="bg-white rounded-borders overflow-hidden">
          <template v-if="equipo">
            <!-- Banner Cabecera del Club -->
            <div class="club-header-banner q-pa-lg text-white" :style="{ background: headerGradient }">
              <div class="row items-center justify-between">
                <div class="row items-center q-gutter-md">
                  <div
                    class="escudo-view-box flex flex-center rounded-borders shadow-2"
                    :style="{ background: equipo.escudocolor || '#059669' }"
                  >
                    <img v-if="equipo.escudoUrl" :src="equipo.escudoUrl" class="escudo-view-img" />
                    <span v-else class="text-h4">{{ equipo.escudoFigura || '🛡️' }}</span>
                  </div>
                  <div>
                    <div class="text-caption text-uppercase text-weight-bold opacity-80">Ficha de Club</div>
                    <h2 class="text-h5 text-weight-bolder q-my-none text-white">{{ equipo.nombre }}</h2>
                    <div class="row items-center q-gutter-sm text-caption opacity-90 q-mt-xs">
                      <span v-if="equipo.barriada || equipo.barrio">
                        <q-icon :name="matPlace" size="14px" /> {{ equipo.barriada || equipo.barrio }}
                      </span>
                      <span>
                        <q-icon :name="matBadge" size="14px" /> Ⓒ Capitán: <strong>{{ equipo.capitan || 'Sin asignar' }}</strong>
                      </span>
                    </div>

                    <!-- Estado Reglamentario: Mínimo 11 personas y Capitán Oficial -->
                    <div class="q-mt-xs row items-center q-gutter-xs">
                      <span
                        v-if="plantel.length >= 11"
                        class="bg-emerald-800 text-emerald-100 text-caption text-weight-bold q-px-sm q-py-xs rounded-borders inline-flex items-center"
                      >
                        <q-icon name="check_circle" size="14px" class="q-mr-xs text-positive" />
                        Nómina con {{ plantel.length }} jugadores
                      </span>
                      <span
                        v-else
                        class="bg-amber-9 text-white text-caption text-weight-bold q-px-sm q-py-xs rounded-borders inline-flex items-center"
                      >
                        <q-icon name="warning" size="14px" class="q-mr-xs text-white" />
                        {{ plantel.length }}/11 jugadores (Mínimo 11)
                      </span>

                      <!-- Badge de Capitán -->
                      <span
                        v-if="store.tieneCapitan(equipo.id)"
                        class="bg-amber-8 text-white text-caption text-weight-bold q-px-sm q-py-xs rounded-borders inline-flex items-center font-11"
                      >
                        Ⓒ Capitán Oficial: {{ equipo.capitan }}
                      </span>
                      <span
                        v-else
                        class="bg-rose-9 text-white text-caption text-weight-bold q-px-sm q-py-xs rounded-borders inline-flex items-center font-11"
                      >
                        ⚠️ Sin Capitán Designado
                      </span>
                    </div>
                  </div>
                </div>

                <div class="row items-center q-gutter-sm">
                  <q-btn
                    v-if="store.esOrganizador && plantel.length < 11"
                    unelevated
                    no-caps
                    color="amber-4"
                    text-color="dark"
                    :icon="matPersonAdd"
                    :label="`Completar a 11 (${plantel.length}/11)`"
                    class="text-weight-bold shadow-1"
                    :loading="completandoPlantel"
                    @click="completarPlantelClub(equipo.id)"
                  >
                    <q-tooltip>Incorporar automáticamente los jugadores restantes para habilitar partidos oficiales</q-tooltip>
                  </q-btn>
                  <q-btn
                    v-if="store.esEntrenador && store.miEquipoId === equipo.id"
                    outline
                    no-caps
                    color="white"
                    :icon="matSports"
                    label="Elegir Posiciones (Pizarra DT)"
                    class="text-weight-bold"
                    @click="irAPizarraDT(equipo.id)"
                  />
                  <q-badge v-else-if="store.esEntrenador" color="emerald-9" text-color="white" class="text-weight-bold q-px-sm q-py-xs">
                    Modo DT · Nómina de {{ equipo?.nombre }}
                  </q-badge>
                  <q-badge v-else-if="store.esJugador" color="indigo-8" text-color="white" class="text-weight-bold q-px-sm q-py-xs">
                    👁️ Modo Futbolista · Nómina Oficial
                  </q-badge>
                </div>
              </div>
            </div>

            <!-- Tabla de Plantel -->
            <div class="q-pa-md">
              <div class="row items-center justify-between q-mb-sm">
                <div>
                  <div class="text-subtitle2 text-weight-bold text-dark">Plantel Oficial del Club</div>
                  <div class="text-caption text-grey-7 font-mono">
                    {{ plantel.length }} en nómina ·
                    <span :class="store.cantidadEnCancha(equipoSeleccionado?.id) > 11 ? 'text-negative text-weight-bolder' : 'text-emerald-8 text-weight-bold'">
                      {{ store.cantidadEnCancha(equipoSeleccionado?.id) }}/11 en cancha
                    </span>
                    <span v-if="store.cantidadEnCancha(equipoSeleccionado?.id) > 11" class="text-negative text-weight-bolder q-ml-xs">
                      ⚠️ (Excedido en +{{ store.cantidadEnCancha(equipoSeleccionado?.id) - 11 }})
                    </span>
                    · {{ store.cantidadEnBanca(equipoSeleccionado?.id) }} en banca
                  </div>
                </div>
                <q-btn
                  v-if="store.cantidadEnCancha(equipoSeleccionado?.id) > 11"
                  unelevated
                  dense
                  size="sm"
                  color="negative"
                  no-caps
                  label="Enviar excedentes a banca"
                  @click="store.enviarExcedentesABanca(equipoSeleccionado?.id)"
                />
              </div>

              <div class="table-responsive">
                <table class="roster-table">
                  <thead>
                    <tr>
                      <th class="th-dorsal text-center">Dorsal</th>
                      <th class="th-name text-left">Jugador</th>
                      <th class="th-pos text-center">Posición / Rol</th>
                      <th class="th-goles text-center">Goles</th>
                      <th class="th-cards text-center">Tarjetas</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="j in plantel" :key="j.id" class="roster-row">
                      <td class="text-center font-mono text-weight-bold text-primary">
                        #{{ j.dorsal ?? j.numero ?? '—' }}
                      </td>
                      <td class="text-weight-bold text-dark">
                        <div class="row items-center no-wrap q-gutter-xs">
                          <span>{{ [j.nombre, j.apellido].filter(Boolean).join(' ') }}</span>
                          <q-badge
                            v-if="j.esCapitan || equipo?.capitan === j.nombre"
                            color="amber-9"
                            text-color="white"
                            class="text-weight-bolder font-10 q-px-xs"
                            title="Capitán Oficial del Club"
                          >
                            Ⓒ CAPITÁN
                          </q-badge>
                        </div>
                      </td>
                      <td class="text-center">
                        <span
                          class="pos-badge"
                          :class="store.normalizarPosicion(j.posicion) === 'banca' ? 'pos-badge-banca' : 'pos-badge-cancha'"
                        >
                          {{ store.normalizarPosicion(j.posicion) === 'banca' ? '🪑 En Banca' : (j.posicion || 'Delantero') }}
                        </span>
                      </td>
                      <td class="text-center font-mono text-weight-bold">
                        {{ j.goles ?? 0 }}
                      </td>
                      <td class="text-center">
                        <span class="card-pill bg-amber-500 text-white q-mr-xs">{{ j.amarillas ?? 0 }}</span>
                        <span class="card-pill bg-rose-600 text-white">{{ j.rojas ?? 0 }}</span>
                      </td>
                    </tr>

                    <tr v-if="!plantel.length">
                      <td colspan="5" class="text-center q-py-lg text-grey-6">
                        <div class="q-py-md">
                          <q-icon :name="matPersonOutline" size="32px" color="grey-4" class="q-mb-xs" />
                          <div class="text-body2 text-weight-medium">Aún no hay jugadores registrados en este club.</div>
                          <div class="text-caption text-grey-6 q-mt-xs">
                            Los futbolistas se incorporan al registrarse con rol jugador (contraseña: 1234) o mediante la nómina completada por el organizador.
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>

          <q-card-section v-else class="q-pa-xl text-center text-grey-6">
            <q-icon :name="matTouchApp" size="40px" color="grey-4" class="q-mb-sm" />
            <div class="text-subtitle1 text-weight-medium">Selecciona un club para ver su nómina oficial</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Modales -->
    <EquipoDialog v-model="modalEquipo" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useTorneo, ROLES } from '../torneo.js'
import EquipoDialog from '../components/EquipoDialog.vue'
import {
  matAdd,
  matPersonAdd,
  matChevronRight,
  matGroups,
  matPersonOutline,
  matTouchApp,
  matPlace,
  matBadge,
  matSports,
  matShield
} from '@quasar/extras/material-icons'

const $q = useQuasar()
const store = useTorneo()
const roleStore = store
const router = useRouter()

const seleccionId = ref(store.miEquipoId || null)
const modalEquipo = ref(false)
const completandoPlantel = ref(false)

const clubesVisibles = computed(() => {
  if (store.esEntrenador || store.esJugador) {
    const miId = String(store.miEquipoId || '').trim()
    if (miId) {
      return store.equipos.filter(e => String(e.id || e._id || '').trim() === miId)
    }
    return []
  }
  return store.equipos
})

watch(() => store.miEquipoId, (id) => {
  if (id && (store.esEntrenador || store.esJugador)) {
    seleccionId.value = String(id).trim()
  }
}, { immediate: true })

async function completarPlantelClub(equipoId) {
  completandoPlantel.value = true
  try {
    const res = await store.completarPlantelEquipo(equipoId)
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: res.msg || 'Plantel completado a 11 jugadores reglamentarios.',
      position: 'top',
      timeout: 3500
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      icon: 'error',
      message: err.message || 'Error al completar el plantel',
      position: 'top',
      timeout: 3500
    })
  } finally {
    completandoPlantel.value = false
  }
}

function irAPizarraDT(equipoId) {
  router.push('/entrenador')
}

const equipo = computed(() => {
  if (store.esEntrenador || store.esJugador) {
    const miId = String(store.miEquipoId || '').trim()
    if (miId) {
      return store.equipoPorId(miId) || clubesVisibles.value[0] || null
    }
    return null
  }
  if (seleccionId.value) {
    const e = store.equipoPorId(seleccionId.value)
    if (e) return e
  }
  return clubesVisibles.value[0] || store.equipos[0] || null
})

const plantel = computed(() => {
  if (!equipo.value) return []
  return store.jugadores.filter(j => j.equipoId === equipo.value.id || j.equipo === equipo.value.id)
})

const headerGradient = computed(() => {
  const c = equipo.value?.color || equipo.value?.escudocolor || '#059669'
  return `linear-gradient(135deg, #090d16 0%, ${c} 100%)`
})
</script>

<style scoped>
.border-b {
  border-bottom: 1px solid #e2e8f0;
}
.bg-slate-50 {
  background-color: #f8fafc;
}
.club-avatar-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-block;
}
.active-club-item {
  background-color: #f0fdf4 !important;
  border-left: 3px solid #059669;
}
.club-header-banner {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.opacity-80 {
  opacity: 0.8;
}
.opacity-90 {
  opacity: 0.9;
}
.table-responsive {
  overflow-x: auto;
  width: 100%;
}
.roster-table {
  width: 100%;
  border-collapse: collapse;
}
.roster-table thead th {
  background-color: #f8fafc;
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 10px 12px;
  border-bottom: 2px solid #e2e8f0;
}
.roster-table tbody td {
  padding: 10px 12px;
  font-size: 0.88rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.roster-row:hover {
  background-color: #f8fafc;
}
.pos-badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.74rem;
  font-weight: 600;
  display: inline-block;
}
.pos-badge-banca {
  background-color: #f1f5f9;
  color: #475569;
  border: 1px dashed #94a3b8;
}
.pos-badge-cancha {
  background-color: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
  font-weight: 700;
}
.card-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  font-size: 0.68rem;
  font-weight: 700;
}
</style>
