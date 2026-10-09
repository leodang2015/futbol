<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="width: 480px; max-width: 95vw" class="rounded-borders">
      <q-card-section class="bg-grey-10 text-white row items-center justify-between q-py-md">
        <div class="row items-center">
          <q-icon :name="matSportsScore" color="positive" size="24px" class="q-mr-sm" />
          <div class="text-subtitle1 text-weight-bold">Registrar Partido / Marcador</div>
        </div>
        <q-btn flat round dense :icon="matClose" v-close-popup text-color="grey-4" />
      </q-card-section>

      <q-card-section class="q-gutter-md q-pa-md">        <!-- Selector de Jornada (Mínimo Fecha 1, Máximo Fecha 5) -->
        <div class="row items-center justify-between bg-grey-2 q-pa-md rounded-borders">
          <div>
            <div class="text-caption text-weight-bold text-grey-8">Jornada Oficial del Torneo</div>
            <div class="text-caption text-grey-6 font-10">Reglamento: Mínimo Fecha 1 · Máximo Fecha 5</div>
          </div>
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
            <span class="text-weight-bold font-mono text-subtitle2 q-px-sm">Fecha {{ form.fecha }} / 5</span>
            <q-btn
              flat
              dense
              round
              :icon="matAdd"
              size="sm"
              :disable="form.fecha >= 5"
              @click="form.fecha = Math.min(5, form.fecha + 1)"
            />
          </div>
        </div>

        <!-- Selector de Fecha y Hora del Partido (En tiempo real, no puede ser posterior) -->
        <div class="bg-slate-50 border q-pa-md rounded-borders">
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-caption text-weight-bold text-slate-800">
              📅 Fecha y Hora del Partido (Tiempo Real) *
            </div>
            <q-btn
              flat
              dense
              no-caps
              size="xs"
              color="primary"
              label="⏱️ Fijar Hora Actual"
              @click="fijarHoraActual"
            />
          </div>
          <q-input
            v-model="form.fechaHora"
            type="datetime-local"
            outlined
            dense
            bg-color="white"
            class="font-mono text-caption"
            :max="maxFechaHoraActual"
          />
          <div class="text-caption text-grey-7 font-10 q-mt-xs">
            Por reglamento, la fecha del partido debe fijarse en tiempo real y no puede ser posterior a la fecha y hora actual.
          </div>
        </div>

<div class="row q-col-gutter-sm items-center q-py-xs">
  
  <!-- Local -->
  <div class="col-5">
    <div class="text-subtitle2 text-weight-bolder text-teal-9 q-mb-xs">Equipo Local *</div>
    <q-select
      v-model="form.local"
      :options="opciones"
      emit-value
      map-options
      outlined
      dense
      bg-color="white"
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
  </div>
    
    <!-- Estado de nómina local -->
    <div v-if="form.local" class="q-mt-xs">
      <span v-if="store.equipoHabilitadoParaJugar(form.local)" class="text-positive text-caption text-weight-bold font-11">
        ✅ Habilitado ({{ store.cantidadEnCancha(form.local) }} en cancha · {{ store.cantidadEnBanca(form.local) }} en banca)
      </span>
      <div v-else-if="store.tieneExcesoEnCancha(form.local)" class="column items-start q-gutter-xs">
        <span class="text-negative text-caption text-weight-bold font-11">
          ⚠️ {{ store.cantidadEnCancha(form.local) }}/11 en cancha (Excedido en +{{ store.cantidadEnCancha(form.local) - 11 }})
        </span>
        <q-btn flat dense no-caps size="xs" color="negative" label="🪑 Enviar excedentes a banca" @click="store.enviarExcedentesABanca(form.local)" />
      </div>
      <div v-else class="column items-start q-gutter-xs">
        <span class="text-negative text-caption text-weight-bold font-11">
          ⚠️ Incompleto ({{ store.cantidadJugadoresEquipo(form.local) }}/11 jug.)
        </span>
        <q-btn flat dense no-caps size="xs" color="primary" label="+ Completar a 11" :loading="completando" @click="completarPlantel(form.local)" />
      </div>
    </div>
  </div>

<!-- Marcador VS -->
  <div class="col-2 text-center q-pt-md">
    <div class="text-weight-bold text-grey-5 uppercase font-12">VS</div>
  </div>

  <!-- Equipo Visitante -->
  <div class="col-5">
    <div class="text-subtitle2 text-weight-bolder text-teal-9 q-mb-xs">Equipo Visitante *</div>
    <q-select
      v-model="form.visitante"
      :options="opciones"
      emit-value
      map-options
      outlined
      dense
      bg-color="white"
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
  </div>

</div>
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
  </div>

</div>


        <!-- Alerta Reglamentaria: Mínimo 11 personas -->
        <div v-if="alertaReglamentaria" class="bg-amber-1 border border-amber-3 q-pa-md rounded-borders text-amber-10 row items-center no-wrap">
          <q-icon name="warning" size="20px" class="q-mr-sm" color="amber-9" />
          <div class="text-caption text-weight-medium">
            {{ alertaReglamentaria }}
          </div>
        </div>

        <!-- Goles -->
        <div class="row q-col-gutter-lg items-center justify-center q-my-md">
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

      <q-card-actions align="right" class="q-px-lg q-py-md bg-grey-1">
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

function getAhoraString() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

const vacio = () => ({
  fecha: 1,
  fechaHora: getAhoraString(),
  local: null,
  visitante: null,
  golesLocal: 0,
  golesVisitante: 0
})

const maxFechaHoraActual = computed(() => {
  const d = new Date(Date.now() + 60000)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
})

function fijarHoraActual() {
  form.value.fechaHora = getAhoraString()
}

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

const conflictoDescanso = computed(() => {
  if (!form.value.local && !form.value.visitante) return ''
  const fNueva = Number(form.value.fecha || 1)
  const locTarget = String(form.value.local || '').trim()
  const visTarget = String(form.value.visitante || '').trim()

  for (const p of store.partidos) {
    const fExistente = Number(p.fecha || p.jornada || 1)
    const locId = String(p.localId || (p.local && typeof p.local === 'object' ? (p.local._id || p.local.id) : p.local) || '').trim()
    const visId = String(p.visitanteId || (p.visitante && typeof p.visitante === 'object' ? (p.visitante._id || p.visitante.id) : p.visitante) || '').trim()

    if (locTarget && (locId === locTarget || visId === locTarget)) {
      if (Math.abs(fNueva - fExistente) < 2) {
        return `⚠️ Regla de descanso: El club "${nombreEquipo(form.value.local)}" ya tiene partido en la Fecha ${fExistente}. Por reglamento oficial debe tener mínimo 2 fechas después de ese partido para jugar de nuevo (próxima fecha habilitada: Fecha ${fExistente + 2} o superior).`
      }
    }
    if (visTarget && (locId === visTarget || visId === visTarget)) {
      if (Math.abs(fNueva - fExistente) < 2) {
        return `⚠️ Regla de descanso: El club "${nombreEquipo(form.value.visitante)}" ya tiene partido en la Fecha ${fExistente}. Por reglamento oficial debe tener mínimo 2 fechas después de ese partido para jugar de nuevo (próxima fecha habilitada: Fecha ${fExistente + 2} o superior).`
      }
    }
  }
  return ''
})

const alertaReglamentaria = computed(() => {
  if (conflictoDescanso.value) {
    return conflictoDescanso.value
  }
  if (form.value.fechaHora && new Date(form.value.fechaHora).getTime() > Date.now() + 65000) {
    return '⚠️ La fecha y hora del encuentro debe colocarse en tiempo real y no puede ser posterior al momento actual.'
  }
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
  const esFechaHoraValida = Boolean(form.value.fechaHora) && new Date(form.value.fechaHora).getTime() <= (Date.now() + 65000)
  return Boolean(
    form.value.local &&
    form.value.visitante &&
    form.value.local !== form.value.visitante &&
    store.equipoHabilitadoParaJugar(form.value.local) &&
    store.equipoHabilitadoParaJugar(form.value.visitante) &&
    !conflictoDescanso.value &&
    esFechaHoraValida
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

  if (conflictoDescanso.value) {
    error.value = conflictoDescanso.value
    return
  }

  if (form.value.fechaHora && new Date(form.value.fechaHora).getTime() > Date.now() + 65000) {
    error.value = 'La fecha y hora del encuentro debe colocarse en tiempo real y no puede ser posterior al momento actual.'
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
      fechaHora: form.value.fechaHora || new Date().toISOString(),
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
