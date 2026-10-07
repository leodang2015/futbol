<template>
  <div class="entrenador-view">
    <!-- Header del Entrenador -->
    <q-card flat bordered class="bg-white rounded-borders q-mb-md">
      <q-card-section class="row items-center justify-between q-py-md">
        <div class="row items-center q-gutter-sm">
          <q-avatar size="44px" color="emerald-1" text-color="positive" class="text-weight-bold">
            <q-icon :name="matSports" size="24px" />
          </q-avatar>
          <div>
            <div class="row items-center q-gutter-xs">
              <span class="text-h6 text-weight-bold text-slate-900">Pizarra Táctica del Entrenador</span>
              <q-badge color="positive" text-color="white" label="Rol: DT / Club" class="q-ml-xs text-weight-medium" />
            </div>
            <div class="text-caption text-grey-6">
              Organiza la formación de tu equipo y asigna las posiciones tácticas de cada jugador en tiempo real.
            </div>
          </div>
        </div>

        <!-- Selector de Club para el Entrenador -->
        <div class="row items-center q-gutter-sm">
          <div class="text-caption text-weight-medium text-grey-7">Tu Club:</div>
          <q-select
            v-model="equipoSeleccionadoId"
            :options="opcionesEquipos"
            emit-value
            map-options
            outlined
            dense
            style="min-width: 220px"
            bg-color="grey-1"
          >
            <template #selected-item="scope">
              <div v-if="scope.opt" class="row items-center no-wrap">
                <span
                  class="club-dot q-mr-xs"
                  :style="{ backgroundColor: scope.opt.color || '#059669' }"
                />
                <span class="text-weight-bold text-slate-800 ellipsis">{{ scope.opt.label }}</span>
              </div>
            </template>
          </q-select>

          <q-btn
            color="primary"
            unelevated
            no-caps
            :icon="matPersonAdd"
            label="Agregar Jugador"
            @click="mostrarDialogoJugador = true"
            class="text-weight-bold"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Si no hay equipos -->
    <q-card v-if="!store.equipos.length" flat bordered class="bg-white rounded-borders q-pa-xl text-center">
      <q-icon :name="matGroups" size="56px" color="grey-4" class="q-mb-md" />
      <div class="text-h6 text-weight-bold text-slate-800">No hay clubes registrados todavía</div>
      <div class="text-caption text-grey-6 q-mb-md">
        Cada entrenador funda su propio club al registrarse en la plataforma.
      </div>
      <q-btn
        color="primary"
        unelevated
        no-caps
        label="Ver Clubes del Torneo"
        :to="'/equipos'"
      />
    </q-card>

    <div v-else>
      <!-- ANUNCIO DE ADVERTENCIA REGLAMENTARIA: Más de 11 jugadores en cancha -->
      <q-banner
        v-if="hayExcesoEnCancha"
        dense
        rounded
        class="bg-negative text-white q-mb-md q-pa-md shadow-4 border-rose-8 animate-pulse-gentle"
      >
        <template #avatar>
          <q-icon :name="matWarning" size="40px" color="amber-3" />
        </template>
        <div class="row items-center justify-between no-wrap q-gutter-md">
          <div>
            <div class="text-subtitle1 text-weight-bolder row items-center q-gutter-xs">
              <span>🚨 ADVERTENCIA REGLAMENTARIA: ¡HAY MÁS DE 11 JUGADORES EN LA CANCHA!</span>
              <q-badge color="amber-3" text-color="dark" class="text-weight-bolder q-ml-sm font-12">
                {{ totalEnCancha }} en cancha (+{{ totalEnCancha - 11 }} de más)
              </q-badge>
            </div>
            <div class="text-body2 text-slate-100 q-mt-xs">
              Por reglamento oficial del torneo, <strong>solo se permite jugar con un máximo de 11 futbolistas en la cancha</strong>.
              Actualmente tienes <strong>{{ totalEnCancha }}</strong> jugadores en posición de juego.
              Debes asignar el rol <strong>"En Banca"</strong> a los <strong>{{ totalEnCancha - 11 }}</strong> suplentes para cumplir la regla.
            </div>
          </div>
          <q-btn
            unelevated
            no-caps
            color="amber-4"
            text-color="dark"
            :icon="matEventSeat"
            label="Enviar Excedentes a Banca"
            class="text-weight-bolder shadow-1 text-no-wrap"
            :loading="enviandoBanca"
            @click="autoAjustarBanca"
          />
        </div>
      </q-banner>

      <!-- BANNER DE CONFORMIDAD: Exactamente 11 jugadores en cancha -->
      <q-banner
        v-else-if="totalEnCancha === 11"
        dense
        rounded
        class="bg-emerald-1 text-emerald-10 q-mb-md q-py-sm q-px-md border-emerald-3"
      >
        <template #avatar>
          <q-icon :name="matCheckCircle" size="24px" color="positive" />
        </template>
        <div class="row items-center justify-between full-width">
          <div class="text-caption text-weight-bold">
            ✅ <strong>Alineación Oficial Reglamentaria:</strong> Tienes exactamente 11 jugadores en cancha.
            <span v-if="suplentesBanca.length" class="text-weight-normal text-grey-8 q-ml-xs">
              ({{ suplentesBanca.length }} suplentes en banca listos para ingresar).
            </span>
          </div>
          <q-badge color="positive" text-color="white" label="11 / 11 En Cancha" class="text-weight-bold font-12" />
        </div>
      </q-banner>

      <!-- BANNER INFORMATIVO: Menos de 11 jugadores en cancha -->
      <q-banner
        v-else-if="jugadoresDelEquipo.length >= 11 && totalEnCancha < 11"
        dense
        rounded
        class="bg-sky-1 text-sky-10 q-mb-md q-py-sm q-px-md border-sky-3"
      >
        <template #avatar>
          <q-icon :name="matInfo" size="24px" color="info" />
        </template>
        <div class="row items-center justify-between full-width">
          <div class="text-caption">
            ℹ️ <strong>Alineación en Cancha:</strong> Tienes <strong>{{ totalEnCancha }}/11</strong> titulares asignados.
            Faltan <strong>{{ 11 - totalEnCancha }}</strong> jugadores para completar los 11 reglamentarios en cancha (tienes {{ suplentesBanca.length }} en banca).
          </div>
          <q-badge color="info" text-color="white" :label="`${totalEnCancha}/11 en cancha`" class="text-weight-bold" />
        </div>
      </q-banner>

      <div class="row q-col-gutter-lg">
        <!-- Columna Izquierda: Cancha Táctica Visual -->
        <div class="col-12 col-lg-7">
          <q-card flat bordered class="bg-white rounded-borders overflow-hidden">
            <q-card-section class="bg-slate-900 text-white row items-center justify-between q-py-sm">
              <div class="row items-center q-gutter-xs">
                <q-icon :name="matStadium" size="20px" color="positive" />
                <span class="text-subtitle2 text-weight-bold">Alineación Táctica en Cancha</span>
                <span v-if="equipoActual" class="text-caption text-grey-4">({{ equipoActual.nombre }})</span>
                <q-badge
                  :color="hayExcesoEnCancha ? 'negative' : (totalEnCancha === 11 ? 'positive' : 'amber-8')"
                  text-color="white"
                  :label="`${totalEnCancha}/11 en Cancha`"
                  class="q-ml-xs text-weight-bold"
                />
              </div>
              <div class="row items-center q-gutter-xs">
                <span class="text-caption text-grey-4 q-mr-xs">Esquema:</span>
                <q-btn-toggle
                  v-model="esquemaTactico"
                  toggle-color="primary"
                  color="slate-800"
                  text-color="grey-4"
                  dense
                  flat
                  :options="[
                    { label: '4-3-3', value: '4-3-3' },
                    { label: '4-4-2', value: '4-4-2' },
                    { label: '3-5-2', value: '3-5-2' }
                  ]"
                />
              </div>
            </q-card-section>

            <!-- Campo de Fútbol Virtual -->
            <div class="pitch-container q-pa-md">
              <div class="soccer-pitch">
                <!-- Líneas reglamentarias del campo -->
                <div class="pitch-line center-line"></div>
                <div class="pitch-circle center-circle"></div>
                <div class="pitch-circle center-dot"></div>
                <div class="pitch-area penalty-area-top"></div>
                <div class="pitch-area penalty-area-bottom"></div>
                <div class="pitch-area goal-area-bottom"></div>

                <!-- Zona Delanteros (Ataque) -->
                <div class="pitch-zone zone-attack">
                  <div class="zone-label text-caption text-weight-bolder">DELANTEROS ({{ delanteros.length }})</div>
                  <div class="players-row">
                    <div
                      v-for="j in delanteros"
                      :key="j.id"
                      class="pitch-player-card cursor-pointer"
                      @click="seleccionarParaEditar(j)"
                    >
                      <div class="player-number bg-amber-6 text-white">{{ j.numero || j.dorsal || 9 }}</div>
                      <div class="player-name ellipsis">{{ j.nombre }} {{ j.apellido ? j.apellido[0] + '.' : '' }}</div>
                    </div>
                    <div v-if="!delanteros.length" class="empty-zone-hint">
                      Sin delanteros asignados
                    </div>
                  </div>
                </div>

                <!-- Zona Mediocampo -->
                <div class="pitch-zone zone-midfield">
                  <div class="zone-label text-caption text-weight-bolder">MEDIOCAMPISTAS ({{ mediocampistas.length }})</div>
                  <div class="players-row">
                    <div
                      v-for="j in mediocampistas"
                      :key="j.id"
                      class="pitch-player-card cursor-pointer"
                      @click="seleccionarParaEditar(j)"
                    >
                      <div class="player-number bg-sky-6 text-white">{{ j.numero || j.dorsal || 8 }}</div>
                      <div class="player-name ellipsis">{{ j.nombre }} {{ j.apellido ? j.apellido[0] + '.' : '' }}</div>
                    </div>
                    <div v-if="!mediocampistas.length" class="empty-zone-hint">
                      Sin mediocampistas asignados
                    </div>
                  </div>
                </div>

                <!-- Zona Defensores -->
                <div class="pitch-zone zone-defense">
                  <div class="zone-label text-caption text-weight-bolder">DEFENSORES ({{ defensores.length }})</div>
                  <div class="players-row">
                    <div
                      v-for="j in defensores"
                      :key="j.id"
                      class="pitch-player-card cursor-pointer"
                      @click="seleccionarParaEditar(j)"
                    >
                      <div class="player-number bg-indigo-6 text-white">{{ j.numero || j.dorsal || 4 }}</div>
                      <div class="player-name ellipsis">{{ j.nombre }} {{ j.apellido ? j.apellido[0] + '.' : '' }}</div>
                    </div>
                    <div v-if="!defensores.length" class="empty-zone-hint">
                      Sin defensores asignados
                    </div>
                  </div>
                </div>

                <!-- Zona Arquero (Bajo los 3 palos) -->
                <div class="pitch-zone zone-goalkeeper">
                  <div class="players-row justify-center">
                    <div
                      v-for="j in arqueros"
                      :key="j.id"
                      class="pitch-player-card cursor-pointer"
                      @click="seleccionarParaEditar(j)"
                    >
                      <div class="player-number bg-emerald-7 text-white ring-gold">{{ j.numero || j.dorsal || 1 }}</div>
                      <div class="player-name ellipsis">{{ j.nombre }} {{ j.apellido ? j.apellido[0] + '.' : '' }} (ARQ)</div>
                    </div>
                    <div v-if="!arqueros.length" class="empty-zone-hint">
                      Sin arquero asignado
                    </div>
                  </div>
                  <div class="zone-label text-caption text-weight-bolder text-center q-mt-xs">PORTERO ({{ arqueros.length }})</div>
                </div>
              </div>
            </div>

            <!-- Zona BANCA DE SUPLENTES (DUGOUT) -->
            <div class="dugout-section q-px-md q-py-sm bg-slate-900 border-top">
              <div class="row items-center justify-between q-mb-xs">
                <div class="row items-center q-gutter-xs">
                  <q-icon :name="matEventSeat" size="18px" color="amber-4" />
                  <span class="text-caption text-weight-bolder text-slate-200">BANCA DE SUPLENTES</span>
                  <q-badge color="blue-grey-7" text-color="white" :label="`${suplentesBanca.length} suplentes`" />
                </div>
                <div class="text-caption text-slate-400 font-11">
                  Rol: <strong>En Banca</strong> · Listos para sustitución
                </div>
              </div>

              <div class="row q-gutter-xs items-center q-py-xs">
                <div
                  v-for="j in suplentesBanca"
                  :key="j.id"
                  class="bench-chip row items-center q-px-sm q-py-xs rounded-borders cursor-pointer"
                  @click="seleccionarParaEditar(j)"
                >
                  <span class="bench-dorsal font-mono text-weight-bolder text-amber-4 q-mr-xs">#{{ j.numero || j.dorsal || '-' }}</span>
                  <span class="text-caption text-weight-bold text-white ellipsis" style="max-width: 90px">{{ j.nombre }}</span>
                  <q-btn
                    flat
                    round
                    dense
                    size="xs"
                    color="positive"
                    :icon="matArrowUpward"
                    title="Pasar a Titular en Cancha"
                    class="q-ml-xs"
                    @click.stop="cambiarPosicion(j, 'Delantero')"
                  />
                </div>
                <div v-if="!suplentesBanca.length" class="text-caption text-slate-400 italic q-pa-xs">
                  No hay suplentes en la banca. Puedes cambiar la posición de jugadores a "En Banca".
                </div>
              </div>
            </div>

            <!-- Resumen del Plantel Táctico -->
            <q-card-section class="bg-grey-1 row items-center justify-around q-py-sm border-top text-center">
              <div>
                <div class="text-caption text-grey-6">Arqueros</div>
                <div class="text-subtitle2 text-weight-bold text-emerald-8">{{ arqueros.length }}</div>
              </div>
              <div>
                <div class="text-caption text-grey-6">Defensores</div>
                <div class="text-subtitle2 text-weight-bold text-indigo-8">{{ defensores.length }}</div>
              </div>
              <div>
                <div class="text-caption text-grey-6">Mediocampo</div>
                <div class="text-subtitle2 text-weight-bold text-sky-8">{{ mediocampistas.length }}</div>
              </div>
              <div>
                <div class="text-caption text-grey-6">Delanteros</div>
                <div class="text-subtitle2 text-weight-bold text-amber-8">{{ delanteros.length }}</div>
              </div>
              <div class="q-px-sm q-py-xs rounded-borders" :class="hayExcesoEnCancha ? 'bg-red-1 border border-red-3' : (totalEnCancha === 11 ? 'bg-emerald-1 border border-emerald-3' : '')">
                <div class="text-caption text-weight-bold" :class="hayExcesoEnCancha ? 'text-negative' : 'text-grey-7'">En Cancha</div>
                <div
                  class="text-subtitle2 text-weight-bolder"
                  :class="hayExcesoEnCancha ? 'text-negative' : (totalEnCancha === 11 ? 'text-positive' : 'text-slate-900')"
                >
                  {{ totalEnCancha }}/11
                  <span v-if="hayExcesoEnCancha">⚠️</span>
                  <span v-else-if="totalEnCancha === 11">✅</span>
                </div>
              </div>
              <div>
                <div class="text-caption text-grey-6">En Banca</div>
                <div class="text-subtitle2 text-weight-bold text-blue-grey-8">{{ suplentesBanca.length }} 🪑</div>
              </div>
              <div>
                <div class="text-caption text-grey-6">Plantel Total</div>
                <div class="text-subtitle2 text-weight-bold text-slate-900">{{ jugadoresDelEquipo.length }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Columna Derecha: Asignación y Selección de Posición -->
        <div class="col-12 col-lg-5">
          <q-card flat bordered class="bg-white rounded-borders">
            <q-card-section class="bg-slate-900 text-white row items-center justify-between q-py-sm">
              <div class="row items-center q-gutter-xs">
                <q-icon :name="matSwapHoriz" size="20px" color="amber" />
                <span class="text-subtitle2 text-weight-bold">Asignar Posiciones de Jugadores</span>
              </div>
              <q-badge color="primary" text-color="white" :label="`${jugadoresDelEquipo.length} futbolistas`" />
            </q-card-section>

            <q-card-section class="q-pa-md">
              <div class="text-caption text-grey-7 q-mb-md">
                Como <strong>Entrenador</strong>, selecciona la posición táctica o asigna el rol <strong>"En Banca"</strong> a tus suplentes. Solo pueden jugar 11 en cancha.
              </div>

              <!-- Notificación de cambio reciente -->
              <q-banner v-if="mensajeExito" dense rounded class="bg-emerald-1 text-positive q-mb-md text-caption">
                <template #avatar>
                  <q-icon :name="matCheckCircle" color="positive" size="18px" />
                </template>
                {{ mensajeExito }}
              </q-banner>

              <!-- Lista de jugadores para asignación rápida -->
              <div v-if="!jugadoresDelEquipo.length" class="text-center q-py-lg text-grey-6">
                <q-icon :name="matPersonAdd" size="36px" class="q-mb-xs" />
                <div>No hay jugadores registrados en {{ equipoActual?.nombre || 'este club' }}.</div>
                <q-btn
                  flat
                  color="primary"
                  label="+ Agregar Primer Jugador"
                  class="q-mt-sm"
                  @click="mostrarDialogoJugador = true"
                />
              </div>

              <q-list v-else separator class="rounded-borders overflow-hidden border">
                <q-item
                  v-for="j in jugadoresDelEquipo"
                  :key="j.id"
                  class="q-py-sm items-center"
                  :class="{ 'bg-emerald-50': jugadorEditandoId === j.id, 'bg-slate-50 opacity-90': normalizarPos(j.posicion) === 'banca' }"
                >
                  <!-- Dorsal -->
                  <q-item-section avatar style="min-width: 44px">
                    <div
                      class="dorsal-badge text-weight-bold text-center"
                      :style="{ backgroundColor: colorPorPosicion(j.posicion) }"
                    >
                      {{ j.numero || j.dorsal || '—' }}
                    </div>
                  </q-item-section>

                  <!-- Nombre y Datos -->
                  <q-item-section>
                    <q-item-label class="text-weight-bold text-slate-800">
                      {{ j.nombre }} {{ j.apellido || '' }}
                    </q-item-label>
                    <q-item-label caption class="text-grey-6 row items-center q-gutter-xs">
                      <span>Estado:</span>
                      <q-badge
                        :color="badgeColorPorPosicion(j.posicion)"
                        :label="normalizarPos(j.posicion) === 'banca' ? '🪑 En Banca' : j.posicion || 'Delantero'"
                        class="text-weight-medium"
                      />
                    </q-item-label>
                  </q-item-section>

                  <!-- Botón rápido Toggle Banca / Cancha -->
                  <q-item-section side class="row items-center no-wrap q-gutter-xs">
                    <q-btn
                      v-if="normalizarPos(j.posicion) === 'banca'"
                      dense
                      flat
                      round
                      size="sm"
                      color="positive"
                      :icon="matArrowUpward"
                      title="Mover a Titular en Cancha"
                      @click="cambiarPosicion(j, 'Delantero')"
                    />
                    <q-btn
                      v-else
                      dense
                      flat
                      round
                      size="sm"
                      color="blue-grey-6"
                      :icon="matEventSeat"
                      title="Enviar a la Banca"
                      @click="cambiarPosicion(j, 'En Banca')"
                    />

                    <!-- Selector de Posición en Vivo -->
                    <q-select
                      :model-value="normalizarPos(j.posicion) === 'banca' ? 'En Banca' : (j.posicion || 'Delantero')"
                      :options="posicionesDisponibles"
                      outlined
                      dense
                      options-dense
                      :loading="actualizandoId === j.id"
                      :disable="actualizandoId === j.id"
                      @update:model-value="cambiarPosicion(j, $event)"
                      style="font-size: 11px; width: 130px;"
                      bg-color="white"
                    >
                      <template #selected-item="scope">
                        <span class="text-weight-bold text-caption ellipsis">
                          {{ scope.opt === 'En Banca' ? '🪑 En Banca' : scope.opt }}
                        </span>
                      </template>
                      <template #option="scope">
                        <q-item v-bind="scope.itemProps" dense>
                          <q-item-section>
                            <q-item-label :class="scope.opt === 'En Banca' ? 'text-blue-grey-8 text-weight-bold' : ''">
                              {{ scope.opt === 'En Banca' ? '🪑 En Banca' : scope.opt }}
                            </q-item-label>
                          </q-item-section>
                        </q-item>
                      </template>
                    </q-select>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Modal para dar de alta jugadores en el equipo seleccionado -->
    <JugadorDialog
      v-model="mostrarDialogoJugador"
      :equipo-preseleccionado="equipoSeleccionadoId"
      @update:model-value="alCerrarDialogo"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useTorneo } from '../torneo.js'
import JugadorDialog from '../components/JugadorDialog.vue'
import {
  matSports,
  matStadium,
  matSwapHoriz,
  matPersonAdd,
  matCheckCircle,
  matGroups,
  matWarning,
  matEventSeat,
  matArrowUpward,
  matInfo
} from '@quasar/extras/material-icons'

const store = useTorneo()
const roleStore = store

const esquemaTactico = ref('4-3-3')
const mostrarDialogoJugador = ref(false)
const actualizandoId = ref(null)
const jugadorEditandoId = ref(null)
const mensajeExito = ref('')
const enviandoBanca = ref(false)

const posicionesDisponibles = ['Arquero', 'Defensor', 'Mediocampista', 'Delantero', 'En Banca']

const opcionesEquipos = computed(() =>
  store.equipos.map(e => ({
    label: e.nombre,
    value: e.id || e._id,
    color: e.escudocolor || '#059669'
  }))
)

// Equipo seleccionado: usa el guardado en roleStore o el primer equipo
const equipoSeleccionadoId = ref(
  roleStore.equipoEntrenadorId || (store.equipos[0]?.id ?? '')
)

watch(() => store.equipos, (nuevos) => {
  if (nuevos.length && !equipoSeleccionadoId.value) {
    equipoSeleccionadoId.value = nuevos[0].id || nuevos[0]._id
  }
}, { immediate: true })

watch(equipoSeleccionadoId, (nuevoId) => {
  if (nuevoId) {
    roleStore.setEquipoEntrenador(nuevoId)
  }
})

const equipoActual = computed(() =>
  store.equipos.find(e => (e.id || e._id) === equipoSeleccionadoId.value)
)

const jugadoresDelEquipo = computed(() => {
  if (!equipoSeleccionadoId.value) return []
  return store.jugadores.filter(j => {
    const eqId = j.equipoId || (j.equipo && typeof j.equipo === 'object' ? (j.equipo._id || j.equipo.id) : j.equipo)
    return eqId === equipoSeleccionadoId.value
  })
})

const arqueros = computed(() =>
  jugadoresDelEquipo.value.filter(j => normalizarPos(j.posicion) === 'arquero')
)
const defensores = computed(() =>
  jugadoresDelEquipo.value.filter(j => normalizarPos(j.posicion) === 'defensor')
)
const mediocampistas = computed(() =>
  jugadoresDelEquipo.value.filter(j => normalizarPos(j.posicion) === 'mediocampista')
)
const delanteros = computed(() =>
  jugadoresDelEquipo.value.filter(j => normalizarPos(j.posicion) === 'delantero')
)
const suplentesBanca = computed(() =>
  jugadoresDelEquipo.value.filter(j => normalizarPos(j.posicion) === 'banca')
)
const jugadoresEnCancha = computed(() =>
  jugadoresDelEquipo.value.filter(j => normalizarPos(j.posicion) !== 'banca')
)

const totalEnCancha = computed(() => jugadoresEnCancha.value.length)
const hayExcesoEnCancha = computed(() => totalEnCancha.value > 11)

function normalizarPos(pos) {
  if (!pos) return 'delantero'
  const p = pos.toLowerCase()
  if (p.includes('banc') || p.includes('supl')) return 'banca'
  if (p.includes('arq') || p.includes('por') || p.includes('goalk')) return 'arquero'
  if (p.includes('def') || p.includes('cen') || p.includes('lat')) return 'defensor'
  if (p.includes('med') || p.includes('vol') || p.includes('mid')) return 'mediocampista'
  return 'delantero'
}

function colorPorPosicion(pos) {
  const p = normalizarPos(pos)
  if (p === 'banca') return '#64748b'
  if (p === 'arquero') return '#059669'
  if (p === 'defensor') return '#4f46e5'
  if (p === 'mediocampista') return '#0284c7'
  return '#d97706'
}

function badgeColorPorPosicion(pos) {
  const p = normalizarPos(pos)
  if (p === 'banca') return 'blue-grey-6'
  if (p === 'arquero') return 'positive'
  if (p === 'defensor') return 'indigo-7'
  if (p === 'mediocampista') return 'info'
  return 'warning'
}

async function autoAjustarBanca() {
  if (!equipoSeleccionadoId.value) return
  enviandoBanca.value = true
  try {
    const movidos = await store.enviarExcedentesABanca(equipoSeleccionadoId.value)
    mensajeExito.value = `¡Se enviaron ${movidos} futbolistas a la banca! La alineación en cancha ahora es reglamentaria (11 titulares).`
    setTimeout(() => {
      mensajeExito.value = ''
    }, 4500)
  } catch (err) {
    console.error('Error al auto-ajustar banca:', err)
  } finally {
    enviandoBanca.value = false
  }
}

async function cambiarPosicion(jugador, nuevaPosicion) {
  actualizandoId.value = jugador.id
  jugadorEditandoId.value = jugador.id
  mensajeExito.value = ''
  try {
    await store.actualizarPosicionJugador(jugador.id, nuevaPosicion)
    mensajeExito.value = `¡Posición de ${jugador.nombre} actualizada a ${nuevaPosicion}!`
    setTimeout(() => {
      mensajeExito.value = ''
      jugadorEditandoId.value = null
    }, 3000)
  } catch (err) {
    console.error('Error al actualizar posición:', err)
  } finally {
    actualizandoId.value = null
  }
}

function seleccionarParaEditar(jugador) {
  jugadorEditandoId.value = jugador.id
}

function alCerrarDialogo() {
  store.cargarTodo()
}

onMounted(() => {
  if (!store.equipos.length) {
    store.cargarTodo()
  }
})
</script>

<style scoped>
.club-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

/* Dugout / Banca de suplentes */
.dugout-section {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.bench-chip {
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: all 0.2s ease;
}

.bench-chip:hover {
  background: rgba(51, 65, 85, 1);
  transform: translateY(-1px);
}

.bench-dorsal {
  font-size: 11px;
}

.animate-pulse-gentle {
  animation: pulseGentle 2.5s infinite;
}

@keyframes pulseGentle {
  0%, 100% {
    box-shadow: 0 4px 6px -1px rgba(225, 29, 72, 0.3), 0 2px 4px -2px rgba(225, 29, 72, 0.3);
  }
  50% {
    box-shadow: 0 10px 15px -3px rgba(225, 29, 72, 0.5), 0 4px 6px -4px rgba(225, 29, 72, 0.5);
  }
}

/* Cancha Táctica */
.pitch-container {
  background: #14532d;
  border-radius: 0 0 8px 8px;
}

.soccer-pitch {
  position: relative;
  background: linear-gradient(180deg, #15803d 0%, #166534 50%, #15803d 100%);
  border: 2px solid rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  min-height: 520px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.4);
}

/* Líneas de la cancha */
.pitch-line.center-line {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(255, 255, 255, 0.6);
}

.pitch-circle.center-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90px;
  height: 90px;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-radius: 50%;
}

.pitch-circle.center-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
}

.pitch-area.penalty-area-top {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 180px;
  height: 60px;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-top: none;
}

.pitch-area.penalty-area-bottom {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 180px;
  height: 70px;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-bottom: none;
}

.pitch-area.goal-area-bottom {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 90px;
  height: 30px;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-bottom: none;
}

/* Zonas de Posición */
.pitch-zone {
  position: relative;
  z-index: 2;
  padding: 10px;
}

.zone-label {
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.1em;
  font-size: 10px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.players-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  gap: 8px;
  margin-top: 4px;
}

.pitch-player-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.15s ease;
  max-width: 90px;
}

.pitch-player-card:hover {
  transform: scale(1.08);
}

.player-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  border: 2px solid #ffffff;
}

.ring-gold {
  border-color: #fbbf24 !important;
}

.player-name {
  margin-top: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #ffffff;
  background: rgba(15, 23, 42, 0.75);
  padding: 2px 6px;
  border-radius: 4px;
  max-width: 85px;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.empty-zone-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
  padding: 4px;
}

.dorsal-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.border {
  border: 1px solid #e2e8f0;
}

.border-top {
  border-top: 1px solid #e2e8f0;
}

.bg-emerald-50 {
  background-color: #ecfdf5;
}
</style>
