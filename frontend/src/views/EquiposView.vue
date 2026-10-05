<template>
  <div class="equipos-view">
    <div class="row q-col-gutter-lg">
      <!-- Columna Izquierda: Lista de Clubes -->
      <div class="col-12 col-md-4">
        <q-card flat bordered class="bg-white rounded-borders overflow-hidden">
          <q-card-section class="q-py-md bg-slate-50 border-b">
            <div>
              <div class="text-subtitle1 text-weight-bold text-dark">Clubes del Torneo</div>
              <div class="text-caption text-grey-6">{{ store.equipos.length }} equipos registrados</div>
            </div>
          </q-card-section>

          <q-list separator class="club-list">
            <q-item
              v-for="e in store.equipos"
              :key="e.id"
              clickable
              :active="e.id === seleccionId"
              active-class="active-club-item"
              class="q-py-md"
              @click="seleccionId = e.id"
            >
              <q-item-section avatar>
                <span class="club-avatar-dot shadow-sm" :style="{ background: e.color || e.escudocolor || '#059669' }" />
              </q-item-section>

              <q-item-section>
                <div class="row items-center justify-between no-wrap">
                  <q-item-label class="text-weight-bold text-dark ellipsis">{{ e.nombre }}</q-item-label>
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
                <div>
                  <div class="text-caption text-uppercase text-weight-bold opacity-80">Ficha de Club</div>
                  <h2 class="text-h5 text-weight-bolder q-my-xs text-white">{{ equipo.nombre }}</h2>
                  <div class="row items-center q-gutter-sm text-caption opacity-90">
                    <span v-if="equipo.barriada || equipo.barrio">
                      <q-icon :name="matPlace" size="14px" /> {{ equipo.barriada || equipo.barrio }}
                    </span>
                    <span v-if="equipo.capitan || equipo.tecnico">
                      <q-icon :name="matBadge" size="14px" /> DT/Capitán: {{ equipo.capitan || equipo.tecnico }}
                    </span>
                  </div>

                  <!-- Estado Reglamentario: Mínimo 11 personas para partidos -->
                  <div class="q-mt-sm">
                    <span
                      v-if="plantel.length >= 11"
                      class="bg-emerald-800 text-emerald-100 text-caption text-weight-bold q-px-sm q-py-xs rounded-borders inline-flex items-center"
                    >
                      <q-icon name="check_circle" size="14px" class="q-mr-xs text-positive" />
                      Habilitado para disputar partidos oficiales ({{ plantel.length }} jugadores)
                    </span>
                    <span
                      v-else
                      class="bg-amber-9 text-white text-caption text-weight-bold q-px-sm q-py-xs rounded-borders inline-flex items-center"
                    >
                      <q-icon name="warning" size="14px" class="q-mr-xs text-white" />
                      Nómina en formación: {{ plantel.length }}/11 jugadores (Mínimo 11 para disputar partidos)
                    </span>
                  </div>
                </div>

                <div class="row items-center q-gutter-sm">
                  <q-btn
                    v-if="plantel.length < 11"
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
                    outline
                    no-caps
                    color="white"
                    :icon="matSports"
                    label="Elegir Posiciones (DT)"
                    class="text-weight-bold"
                    @click="irAPizarraDT(equipo.id)"
                  />
                  <q-btn
                    unelevated
                    no-caps
                    color="white"
                    text-color="dark"
                    :icon="matPersonAdd"
                    label="Agregar Jugador"
                    class="text-weight-bold"
                    @click="modalJugador = true"
                  />
                </div>
              </div>
            </div>

            <!-- Tabla de Plantel -->
            <div class="q-pa-md">
              <div class="row items-center justify-between q-mb-sm">
                <div class="text-subtitle2 text-weight-bold text-dark">Plantel Oficial del Club</div>
                <div class="text-caption text-grey-6 font-mono">{{ plantel.length }} jugadores en nómina</div>
              </div>

              <div class="table-responsive">
                <table class="roster-table">
                  <thead>
                    <tr>
                      <th class="th-dorsal text-center">Dorsal</th>
                      <th class="th-name text-left">Jugador</th>
                      <th class="th-pos text-center">Posición</th>
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
                        {{ [j.nombre, j.apellido].filter(Boolean).join(' ') }}
                      </td>
                      <td class="text-center">
                        <span class="pos-badge">{{ j.posicion || 'Jugador' }}</span>
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
                            Haz clic en "Agregar Jugador" para dar de alta al plantel.
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
    <JugadorDialog v-model="modalJugador" :equipo-preseleccionado="seleccionId || equipo?.id" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useTorneo, ROLES } from '../torneo.js'
import EquipoDialog from '../components/EquipoDialog.vue'
import JugadorDialog from '../components/JugadorDialog.vue'
import {
  matAdd,
  matPersonAdd,
  matChevronRight,
  matGroups,
  matPersonOutline,
  matTouchApp,
  matPlace,
  matBadge,
  matSports
} from '@quasar/extras/material-icons'

const $q = useQuasar()
const store = useTorneo()
const roleStore = store
const router = useRouter()

const seleccionId = ref(null)
const modalEquipo = ref(false)
const modalJugador = ref(false)
const completandoPlantel = ref(false)

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
  roleStore.setEquipoEntrenador(equipoId)
  roleStore.cambiarRol(ROLES.ENTRENADOR)
  router.push('/entrenador')
}

const equipo = computed(() => {
  if (seleccionId.value) {
    const e = store.equipoPorId(seleccionId.value)
    if (e) return e
  }
  return store.equipos[0] || null
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
  background-color: #f1f5f9;
  color: #475569;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.74rem;
  font-weight: 600;
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
