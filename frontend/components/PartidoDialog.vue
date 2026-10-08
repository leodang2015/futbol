<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="width: 500px; max-width: 95vw" class="rounded-borders">
      <q-card-section class="bg-grey-10 text-white row items-center justify-between q-py-md">
        <div class="row items-center">
          <q-icon :name="matSportsScore" color="positive" size="24px" class="q-mr-sm" />
          <div class="text-subtitle1 text-weight-bold">Registrar Partido / Marcador</div>
        </div>
        <q-btn flat round dense :icon="matClose" v-close-popup text-color="grey-4" />
      </q-card-section>

      <q-card-section class="q-gutter-md q-pt-md">
        <!-- Selector de Jornada -->
        <div class="row items-center justify-between bg-grey-2 q-pa-sm rounded-borders">
          <div class="text-caption text-weight-bold text-grey-8">Jornada / Fecha del Torneo</div>
          <div class="row items-center q-gutter-xs">
            <q-btn
              flat
              dense
              round
              :icon="matRemove"
              size="sm"
              :disable="form.fecha <= 1"
              @click="form.fecha = Math.max(1, form.fecha - 1)"
            />
            <span class="text-weight-bold font-mono text-subtitle2 q-px-sm">Fecha {{ form.fecha }}</span>
            <q-btn flat dense round :icon="matAdd" size="sm" @click="form.fecha++" />
          </div>
        </div>

        <!-- Enfrentamiento visual -->
        <div class="row q-col-gutter-md items-center">
          <!-- Local -->
          <div class="col-5">
            <div class="text-caption text-weight-medium text-grey-8 q-mb-xs">Equipo Local *</div>
            <q-select
              v-model="form.local"
              :options="opciones"
              emit-value
              map-options
              outlined
              dense
              placeholder="Local"
            >
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <span class="dot" :style="{ background: colorEquipo(scope.opt.value) }" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-bold">{{ scope.opt.label }}</q-item-label>
                    <q-item-label caption>
                      <span :class="scope.opt.habilitado ? 'text-positive text-weight-bold' : 'text-negative text-weight-bold'">
                        {{ scope.opt.badgeText }}
                      </span>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <!-- Estado de nómina local -->
            <div v-if="form.local" class="q-mt-xs">
              <span v-if="store.equipoHabilitadoParaJugar(form.local)" class="text-positive text-caption text-weight-bold font-11">
                ✅ Habilitado ({{ store.cantidadEnCancha(form.local) }} en cancha · {{ store.cantidadEnBanca(form.local) }} en banca)
              </span>
              <div v-else-if="store.tieneExcesoEnCancha(form.local)" class="column items-start q-gutter-xs">
                <span class="text-negative text-caption text-weight-bold font-11">
                  ⚠️ {{ store.cantidadEnCancha(form.local) }}/11 en cancha (Excedido en +{{ store.cantidadEnCancha(form.local) - 11 }})
                </span>
                <q-btn
                  flat
                  dense
                  no-caps
                  size="xs"
                  color="negative"
                  label="🪑 Enviar excedentes a banca"
                  @click="store.enviarExcedentesABanca(form.local)"
                />
              </div>
              <div v-else class="column items-start q-gutter-xs">
                <span class="text-negative text-caption text-weight-bold font-11">
                  ⚠️ Incompleto ({{ store.cantidadJugadoresEquipo(form.local) }}/11 jug.)
                </span>
                <q-btn
                  flat
                  dense
                  no-caps
                  size="xs"
                  color="primary"
                  label="+ Completar a 11"
                  :loading="completando"
                  @click="completarPlantel(form.local)"
                />
              </div>
            </div>
          </div>

          <!-- Marcador VS -->
          <div class="col-2 text-center">
            <div class="text-caption text-weight-bold text-grey-5 uppercase">VS</div>
          </div>

          <!-- Visitante -->
          <div class="col-5">
            <div class="text-caption text-weight-medium text-grey-8 q-mb-xs">Equipo Visitante *</div>
            <q-select
              v-model="form.visitante"
              :options="opciones"
              emit-value
              map-options
              outlined
              dense
              placeholder="Visitante"
            >
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <span class="dot" :style="{ background: colorEquipo(scope.opt.value) }" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-bold">{{ scope.opt.label }}</q-item-label>
                    <q-item-label caption>
                      <span :class="scope.opt.habilitado ? 'text-positive text-weight-bold' : 'text-negative text-weight-bold'">
                        {{ scope.opt.badgeText }}
                      </span>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <!-- Estado de nómina visitante -->
            <div v-if="form.visitante" class="q-mt-xs">
              <span v-if="store.equipoHabilitadoParaJugar(form.visitante)" class="text-positive text-caption text-weight-bold font-11">
                ✅ Habilitado ({{ store.cantidadEnCancha(form.visitante) }} en cancha · {{ store.cantidadEnBanca(form.visitante) }} en banca)
              </span>
              <div v-else-if="store.tieneExcesoEnCancha(form.visitante)" class="column items-start q-gutter-xs">
                <span class="text-negative text-caption text-weight-bold font-11">
                  ⚠️ {{ store.cantidadEnCancha(form.visitante) }}/11 en cancha (Excedido en +{{ store.cantidadEnCancha(form.visitante) - 11 }})
                </span>
                <q-btn
                  flat
                  dense
                  no-caps
                  size="xs"
                  color="negative"
                  label="🪑 Enviar excedentes a banca"
                  @click="store.enviarExcedentesABanca(form.visitante)"
                />
              </div>
              <div v-else class="column items-start q-gutter-xs">
                <span class="text-negative text-caption text-weight-bold font-11">
                  ⚠️ Incompleto ({{ store.cantidadJugadoresEquipo(form.visitante) }}/11 jug.)
                </span>
                <q-btn
                  flat
                  dense
                  no-caps
                  size="xs"
                  color="primary"
                  label="+ Completar a 11"
                  :loading="completando"
                  @click="completarPlantel(form.visitante)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Alerta Reglamentaria: Mínimo 11 personas -->
        <div v-if="alertaReglamentaria" class="bg-amber-1 border border-amber-3 q-pa-sm rounded-borders text-amber-10 row items-center no-wrap">
          <q-icon name="warning" size="20px" class="q-mr-sm" color="amber-9" />
          <div class="text-caption text-weight-medium">
            {{ alertaReglamentaria }}
          </div>
        </div>

        <!-- Goles -->
        <div class="row q-col-gutter-md items-center justify-center q-my-xs">
          <div class="col-5">
            <div class="text-caption text-center text-grey-7 q-mb-xs">Goles {{ nombreEquipo(form.local) || 'Local' }}</div>
            <div class="row items-center justify-center q-gutter-xs bg-grey-1 q-pa-xs rounded-borders">
              <q-btn flat round dense :icon="matRemove" size="sm" :disable="form.golesLocal <= 0" @click="form.golesLocal--" />
              <span class="text-h6 text-weight-bold font-mono q-px-md">{{ form.golesLocal }}</span>
              <q-btn flat round dense :icon="matAdd" size="sm" @click="form.golesLocal++" />
            </div>
          </div>

          <div class="col-2 text-center text-h5 text-grey-5 font-mono">:</div>

          <div class="col-5">
            <div class="text-caption text-center text-grey-7 q-mb-xs">Goles {{ nombreEquipo(form.visitante) || 'Visitante' }}</div>
            <div class="row items-center justify-center q-gutter-xs bg-grey-1 q-pa-xs rounded-borders">
              <q-btn flat round dense :icon="matRemove" size="sm" :disable="form.golesVisitante <= 0" @click="form.golesVisitante--" />
              <span class="text-h6 text-weight-bold font-mono q-px-md">{{ form.golesVisitante }}</span>
              <q-btn flat round dense :icon="matAdd" size="sm" @click="form.golesVisitante++" />
            </div>
          </div>
        </div>

        <div class="text-caption text-grey-7 text-center">
          El resultado se computará de inmediato en la tabla de posiciones oficial.
        </div>
        <div v-if="error" class="text-negative text-caption text-center q-mt-xs">{{ error }}</div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md bg-grey-1">
        <q-btn flat no-caps label="Cancelar" v-close-popup color="grey-7" />
        <q-btn
          color="primary"
          unelevated
          no-caps
          label="Guardar Partido"
          :icon="matCheck"
          :loading="guardando"
          :disable="!puedeGuardar"
          @click="guardar"
        >
          <q-tooltip v-if="!puedeGuardar">
            Ambos clubes deben contar con al menos 11 jugadores registrados para habilitar el partido.
          </q-tooltip>
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTorneo } from '../torneo.js'
import { matSportsScore, matClose, matRemove, matAdd, matCheck } from '@quasar/extras/material-icons'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])
const store = useTorneo()

const vacio = () => ({ fecha: 1, local: null, visitante: null, golesLocal: 0, golesVisitante: 0 })
const form = ref(vacio())
const error = ref('')
const guardando = ref(false)
const completando = ref(false)

const opciones = computed(() =>
  store.equipos.map(e => {
    const id = e.id || e._id
    const cant = store.cantidadJugadoresEquipo(id)
    const enCancha = store.cantidadEnCancha(id)
    const tieneExceso = store.tieneExcesoEnCancha(id)
    const tieneCap = store.tieneCapitan(id)
    const habilitado = cant >= 11 && !tieneExceso && tieneCap
    let badgeText = `${cant} jug. © ✅`
    if (cant < 11) badgeText = `${cant}/11 jug. ⚠️`
    else if (tieneExceso) badgeText = `⚠️ ${enCancha}/11 en cancha`
    else if (!tieneCap) badgeText = `⚠️ Falta Capitán`

    return {
      label: e.nombre,
      value: id,
      cant,
      enCancha,
      tieneExceso,
      tieneCap,
      habilitado,
      badgeText,
      badgeColor: habilitado ? 'positive' : 'negative'
    }
  })
)

function nombreEquipo(id) {
  return store.equipoPorId(id)?.nombre
}

function colorEquipo(id) {
  return store.equipoPorId(id)?.color || store.equipoPorId(id)?.escudocolor || '#059669'
}

const alertaReglamentaria = computed(() => {
  if (form.value.local) {
    const cant = store.cantidadJugadoresEquipo(form.value.local)
    const nom = nombreEquipo(form.value.local)
    if (cant < 11) {
      return `"${nom}" tiene ${cant}/11 jugadores. Se exige un mínimo reglamentario de 11 personas para disputar partidos.`
    }
    if (store.tieneExcesoEnCancha(form.value.local)) {
      const enCancha = store.cantidadEnCancha(form.value.local)
      return `⚠️ ADVERTENCIA: "${nom}" tiene ${enCancha} jugadores en cancha. Solo se permite jugar con un máximo de 11 futbolistas en la cancha. Debe asignar el rol 'En Banca' a los suplentes.`
    }
    if (!store.tieneCapitan(form.value.local)) {
      return `⚠️ REGLA OFICIAL: "${nom}" no tiene un Capitán asignado. Solo se podrá jugar cuando el entrenador escoja al capitán del equipo.`
    }
  }
  if (form.value.visitante) {
    const cant = store.cantidadJugadoresEquipo(form.value.visitante)
    const nom = nombreEquipo(form.value.visitante)
    if (cant < 11) {
      return `"${nom}" tiene ${cant}/11 jugadores. Se exige un mínimo reglamentario de 11 personas para disputar partidos.`
    }
    if (store.tieneExcesoEnCancha(form.value.visitante)) {
      const enCancha = store.cantidadEnCancha(form.value.visitante)
      return `⚠️ ADVERTENCIA: "${nom}" tiene ${enCancha} jugadores en cancha. Solo se permite jugar con un máximo de 11 futbolistas en la cancha. Debe asignar el rol 'En Banca' a los suplentes.`
    }
    if (!store.tieneCapitan(form.value.visitante)) {
      return `⚠️ REGLA OFICIAL: "${nom}" no tiene un Capitán asignado. Solo se podrá jugar cuando el entrenador escoja al capitán del equipo.`
    }
  }
  return ''
})

const puedeGuardar = computed(() => {
  return Boolean(
    form.value.local &&
    form.value.visitante &&
    form.value.local !== form.value.visitante &&
    store.equipoHabilitadoParaJugar(form.value.local) &&
    store.equipoHabilitadoParaJugar(form.value.visitante)
  )
})

async function completarPlantel(equipoId) {
  completando.value = true
  error.value = ''
  try {
    await store.completarPlantelEquipo(equipoId)
  } catch (err) {
    error.value = err.message || 'Error al completar plantel'
  } finally {
    completando.value = false
  }
}

async function guardar() {
  error.value = ''
  if (!form.value.local || !form.value.visitante) {
    error.value = 'Selecciona ambos equipos para el encuentro.'
    return
  }
  if (form.value.local === form.value.visitante) {
    error.value = 'El equipo local y visitante no pueden ser el mismo.'
    return
  }

  const cantLocal = store.cantidadJugadoresEquipo(form.value.local)
  if (cantLocal < 11) {
    error.value = `El club local "${nombreEquipo(form.value.local)}" solo tiene ${cantLocal} jugadores. Se exige un mínimo reglamentario de 11 personas para registrarse a partidos.`
    return
  }

  const cantVisitante = store.cantidadJugadoresEquipo(form.value.visitante)
  if (cantVisitante < 11) {
    error.value = `El club visitante "${nombreEquipo(form.value.visitante)}" solo tiene ${cantVisitante} jugadores. Se exige un mínimo reglamentario de 11 personas para registrarse a partidos.`
    return
  }

  if (!store.tieneCapitan(form.value.local)) {
    error.value = `Solo se podrá jugar cuando el entrenador escoja al capitán del equipo. El club local "${nombreEquipo(form.value.local)}" no tiene capitán designado.`
    return
  }

  if (!store.tieneCapitan(form.value.visitante)) {
    error.value = `Solo se podrá jugar cuando el entrenador escoja al capitán del equipo. El club visitante "${nombreEquipo(form.value.visitante)}" no tiene capitán designado.`
    return
  }

  guardando.value = true
  try {
    await store.guardarPartido({
      fecha: Number(form.value.fecha) || 1,
      local: form.value.local,
      visitante: form.value.visitante,
      golesLocal: Number(form.value.golesLocal) || 0,
      golesVisitante: Number(form.value.golesVisitante) || 0
    })
    form.value = vacio()
    emit('update:modelValue', false)
  } catch (e) {
    error.value = e.message || 'Error al guardar el partido.'
  } finally {
    guardando.value = false
  }
}
</script>

<style scoped>
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.font-mono {
  font-family: 'JetBrains Mono', monospace;
  font-variant-numeric: tabular-nums;
}
</style>
