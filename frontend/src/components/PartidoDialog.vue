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
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
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
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
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
          @click="guardar"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTorneoStore } from '../stores/torneoStore.js'
import { matSportsScore, matClose, matRemove, matAdd, matCheck } from '@quasar/extras/material-icons'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])
const store = useTorneoStore()

const vacio = () => ({ fecha: 1, local: null, visitante: null, golesLocal: 0, golesVisitante: 0 })
const form = ref(vacio())
const error = ref('')
const guardando = ref(false)

const opciones = computed(() => store.equipos.map(e => ({ label: e.nombre, value: e.id || e._id })))

function nombreEquipo(id) {
  return store.equipoPorId(id)?.nombre
}

function colorEquipo(id) {
  return store.equipoPorId(id)?.color || store.equipoPorId(id)?.escudocolor || '#059669'
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
