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
          <!-- Escudo del Club Seleccionado -->
          <div class="row items-center no-wrap bg-slate-50 q-px-sm q-py-xs rounded-borders border cursor-pointer" @click="abrirEditorEscudo" title="Clic para personalizar el escudo">
            <img
              v-if="equipoActual?.escudoUrl"
              :src="equipoActual.escudoUrl"
              alt="Escudo"
              class="club-crest-image q-mr-xs"
            />
            <span v-else class="text-subtitle1 q-mr-xs">{{ equipoActual?.escudoFigura || '🛡️' }}</span>
            <span class="text-caption text-weight-bolder text-slate-900 q-mr-xs">{{ equipoActual?.nombre }}</span>
            <q-btn
              v-if="!store.esJugador"
              flat
              round
              dense
              size="xs"
              color="positive"
              :icon="matShield"
              title="Personalizar Escudo del Club"
            />
          </div>

          <!-- Indicador del Capitán del Equipo -->
          <q-badge
            :color="tieneCapitanAsignado ? 'amber-9' : 'negative'"
            text-color="white"
            class="text-weight-bolder q-px-sm q-py-xs font-11"
          >
            {{ tieneCapitanAsignado ? `Ⓒ Capitán: ${capitanActual?.nombre || equipoActual?.capitan}` : '⚠️ Sin Capitán (Obligatorio para jugar)' }}
            <q-tooltip>
              {{ tieneCapitanAsignado ? 'Equipo habilitado por reglamento para disputar partidos oficiales' : 'Por reglamento, solo se puede jugar cuando el entrenador escoja al capitán' }}
            </q-tooltip>
          </q-badge>

          <!-- Selector de Club: ÚNICAMENTE disponible para el Organizador -->
          <div v-if="store.esOrganizador" class="row items-center q-gutter-xs">
            <div class="text-caption text-weight-medium text-grey-7">Supervisar Club:</div>
            <q-select
              v-model="equipoSeleccionadoId"
              :options="opcionesEquipos"
              emit-value
              map-options
              outlined
              dense
              style="min-width: 170px"
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
          </div>

          <!-- Si es Entrenador: Bloqueado a su propio equipo como responsable único -->
          <div v-else-if="store.esEntrenador" class="row items-center q-gutter-xs bg-emerald-50 q-px-sm q-py-xs rounded-borders border border-emerald-3">
            <span class="text-caption text-weight-bold text-emerald-9">Tu Club Responsable:</span>
            <span class="text-caption text-weight-bolder text-slate-900">{{ equipoActual?.nombre }}</span>
          </div>

          <!-- Si es Jugador: Ficha informativa de su club -->
          <q-badge v-else color="indigo-7" text-color="white" class="text-weight-bold q-px-sm q-py-xs">
            Modo Jugador: {{ equipoActual?.nombre || 'Tu Club' }}
          </q-badge>
        </div>
      </q-card-section>
    </q-card>

    <!-- Selector de Modo: Pizarra Táctica / Reporte de Goleadores -->
    <q-tabs
      v-model="tabVista"
      dense
      no-caps
      class="bg-white rounded-borders shadow-1 q-mb-md"
      active-color="positive"
      indicator-color="positive"
      align="left"
    >
      <q-tab name="pizarra" :icon="matStadium" label="Pizarra Táctica & Alineación (11 en Cancha)" class="text-weight-bold" />
      <q-tab name="goleadores" :icon="matSportsSoccer" label="Reportar Goleadores del Partido (Notificar al Admin)" class="text-weight-bold text-amber-10" />
    </q-tabs>

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
      <!-- ANUNCIO DE ADVERTENCIA REGLAMENTARIA: Falta designar Capitán -->
      <q-banner
        v-if="!tieneCapitanAsignado && jugadoresDelEquipo.length > 0"
        dense
        rounded
        class="bg-amber-1 text-amber-10 q-mb-md q-pa-md border border-amber-4 shadow-2 animate-pulse-gentle"
      >
        <template #avatar>
          <q-icon :name="matMilitaryTech" size="36px" color="amber-9" />
        </template>
        <div class="row items-center justify-between no-wrap q-gutter-md">
          <div>
            <div class="text-subtitle1 text-weight-bolder row items-center q-gutter-xs">
              <span>⚠️ REGLAMENTO OFICIAL: ¡FALTA ESCOGER AL CAPITÁN DEL EQUIPO!</span>
            </div>
            <div class="text-body2 text-slate-800 q-mt-xs">
              Por normativa oficial de la competición, <strong>solo se podrá jugar cuando el entrenador escoja al capitán del equipo (Ⓒ)</strong>.
              Tu club no podrá disputar partidos ni registrar marcadores hasta que nombres al Capitán oficial.
              Haz clic en el ícono de medalla 🎖️ o en <strong>"Nombrar Capitán (Ⓒ)"</strong> en cualquiera de tus futbolistas.
            </div>
          </div>
        </div>
      </q-banner>

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

      <!-- Banner Informativo si no es el DT responsable -->
      <div v-if="!puedeEditarPizarra" class="q-mb-md">
        <q-banner dense rounded class="bg-indigo-1 text-indigo-10 q-pa-sm border border-indigo-2 shadow-1">
          <template #avatar>
            <q-icon :name="matInfo" size="24px" color="indigo-7" />
          </template>
          <div class="text-caption">
            <span v-if="store.esJugador">
              🔒 <strong>Modo Jugador (Solo Lectura):</strong> La Pizarra Táctica y la alineación son responsabilidad exclusiva del Director Técnico ({{ equipoActual?.nombre }}). Los futbolistas no pueden modificar la formación ni asignar roles.
            </span>
            <span v-else-if="store.esOrganizador">
              ℹ️ <strong>Modo Organizador (Supervisión):</strong> La alineación táctica, capitanía y roles son gestionados únicamente por el Director Técnico de cada club.
            </span>
            <span v-else>
              ℹ️ Solo el entrenador responsable del club puede modificar la alineación y posiciones.
            </span>
          </div>
        </q-banner>
      </div>

      <div v-if="tabVista === 'pizarra'" class="row q-col-gutter-lg">
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
                  :disable="!puedeEditarPizarra"
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
                      <div class="player-number bg-amber-6 text-white" :class="{ 'ring-captain': esElCapitan(j) }">
                        {{ j.numero || j.dorsal || 9 }}
                      </div>
                      <div class="player-name ellipsis">
                        {{ j.nombre }} {{ j.apellido ? j.apellido[0] + '.' : '' }}
                        <span v-if="esElCapitan(j)" class="text-amber-4 text-weight-bolder"> Ⓒ</span>
                      </div>
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
                      <div class="player-number bg-sky-6 text-white" :class="{ 'ring-captain': esElCapitan(j) }">
                        {{ j.numero || j.dorsal || 8 }}
                      </div>
                      <div class="player-name ellipsis">
                        {{ j.nombre }} {{ j.apellido ? j.apellido[0] + '.' : '' }}
                        <span v-if="esElCapitan(j)" class="text-amber-4 text-weight-bolder"> Ⓒ</span>
                      </div>
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
                      <div class="player-number bg-indigo-6 text-white" :class="{ 'ring-captain': esElCapitan(j) }">
                        {{ j.numero || j.dorsal || 4 }}
                      </div>
                      <div class="player-name ellipsis">
                        {{ j.nombre }} {{ j.apellido ? j.apellido[0] + '.' : '' }}
                        <span v-if="esElCapitan(j)" class="text-amber-4 text-weight-bolder"> Ⓒ</span>
                      </div>
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
                      <div class="player-number bg-emerald-7 text-white" :class="esElCapitan(j) ? 'ring-captain' : 'ring-gold'">
                        {{ j.numero || j.dorsal || 1 }}
                      </div>
                      <div class="player-name ellipsis">
                        {{ j.nombre }} {{ j.apellido ? j.apellido[0] + '.' : '' }} (ARQ)
                        <span v-if="esElCapitan(j)" class="text-amber-4 text-weight-bolder"> Ⓒ</span>
                      </div>
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
                <q-icon :name="matGroups" size="36px" color="grey-4" class="q-mb-xs" />
                <div class="text-subtitle2 text-weight-medium text-slate-800">No hay futbolistas en {{ equipoActual?.nombre || 'este club' }} todavía.</div>
                <div class="text-caption text-grey-6 q-mt-xs">
                  Los jugadores se integran al iniciar sesión con su cuenta asignada (contraseña reglamentaria: <strong>1234</strong>) o mediante la nómina oficial completada por el organizador.
                </div>
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
                    <div class="row items-center q-gutter-xs">
                      <span class="text-weight-bold text-slate-800">{{ j.nombre }} {{ j.apellido || '' }}</span>
                      <q-badge v-if="esElCapitan(j)" color="amber-9" text-color="white" class="text-weight-bolder font-10 q-px-xs">
                        Ⓒ CAPITÁN OFICIAL
                      </q-badge>
                    </div>
                    <q-item-label caption class="text-grey-6 row items-center q-gutter-xs">
                      <span>Estado:</span>
                      <q-badge
                        :color="badgeColorPorPosicion(j.posicion)"
                        :label="normalizarPos(j.posicion) === 'banca' ? '🪑 En Banca' : j.posicion || 'Delantero'"
                        class="text-weight-medium"
                      />
                    </q-item-label>
                  </q-item-section>

                  <!-- Botón rápido Toggle Banca / Cancha y Capitán -->
                  <q-item-section side class="row items-center no-wrap q-gutter-xs">
                    <template v-if="puedeEditarPizarra">
                      <!-- Botón para Nombrar Capitán -->
                      <q-btn
                        v-if="!esElCapitan(j)"
                        dense
                        flat
                        round
                        size="sm"
                        color="amber-8"
                        :icon="matMilitaryTech"
                        title="Nombrar Capitán del Equipo (Ⓒ)"
                        @click="nombrarCapitan(j)"
                      />

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
                    </template>
                    <template v-else>
                      <q-badge
                        :color="badgeColorPorPosicion(j.posicion)"
                        :label="normalizarPos(j.posicion) === 'banca' ? '🪑 En Banca' : j.posicion || 'Delantero'"
                        class="text-weight-bold q-px-sm"
                      />
                    </template>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- TAB 2: REPORTAR GOLEADORES DEL PARTIDO (Notificar al Administrador) -->
      <div v-else-if="tabVista === 'goleadores'" class="q-gutter-y-md">
        <q-card flat bordered class="bg-white rounded-borders q-pa-lg">
          <div class="row items-center justify-between q-mb-md">
            <div class="row items-center q-gutter-sm">
              <q-avatar size="44px" color="amber-1" text-color="amber-9">
                <q-icon :name="matSportsSoccer" size="26px" />
              </q-avatar>
              <div>
                <div class="text-h6 text-weight-bold text-slate-900">
                  Planilla Oficial de Goleadores · DT {{ equipoActual?.nombre }}
                </div>
                <div class="text-caption text-grey-6">
                  Registra quiénes anotaron los goles de tu equipo en un partido oficial. Al terminar la selección, se enviará una notificación oficial con la planilla al Administrador.
                </div>
              </div>
            </div>
            <q-badge color="positive" text-color="white" class="text-weight-bold q-px-sm q-py-xs">
              Notificación Directa al Organizador
            </q-badge>
          </div>

          <div v-if="!partidosDelClub.length" class="text-center q-pa-xl text-grey-6 bg-slate-50 rounded-borders border">
            <q-icon :name="matCalendarMonth" size="48px" color="grey-4" class="q-mb-sm" />
            <div class="text-subtitle1 text-weight-bold">No hay partidos registrados para tu club todavía</div>
            <div class="text-caption text-grey-6 q-mt-xs">
              Cuando se programen partidos o se carguen fechas en el torneo, podrás seleccionar el partido aquí para registrar los goles.
            </div>
          </div>

          <div v-else class="q-gutter-y-md">
            <!-- Selección del Partido -->
            <div class="bg-slate-50 q-pa-md rounded-borders border">
              <div class="text-subtitle2 text-weight-bold text-slate-800 q-mb-xs">1. Selecciona el Partido Oficial a Reportar:</div>
              <q-select
                v-model="partidoReporteId"
                :options="opcionesPartidosReporte"
                emit-value
                map-options
                outlined
                dense
                bg-color="white"
                placeholder="Elige el partido a reportar"
              >
                <template #option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section>
                      <q-item-label class="text-weight-bold">{{ scope.opt.label }}</q-item-label>
                      <q-item-label caption class="text-grey-6 font-mono">
                        Jornada {{ scope.opt.jornada }} · Estado: {{ scope.opt.estado }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- Datos del Encuentro y Marcador Fijado por el Organizador -->
            <div v-if="partidoSeleccionado" class="bg-slate-50 q-pa-md rounded-borders border q-gutter-y-md">
              <div class="row items-center justify-between">
                <div>
                  <div class="text-subtitle2 text-weight-bold text-slate-800">2. Marcador Oficial Fijado por el Organizador:</div>
                  <div class="text-caption text-grey-7">La cantidad de goles del partido solo puede ser definida por el Organizador. El DT únicamente selecciona los autores de los goles.</div>
                </div>
                <q-badge color="primary" text-color="white" class="text-weight-bold q-px-sm q-py-xs">
                  Oficial Organizador
                </q-badge>
              </div>

              <div class="row q-col-gutter-md items-center justify-center">
                <div class="col-12 col-sm-5 text-center">
                  <div class="text-caption text-weight-bold text-positive q-mb-xs">
                    {{ esLocal ? equipoActual?.nombre : rivalDelPartido?.nombre }} (Local)
                  </div>
                  <div class="bg-white border rounded-borders q-pa-sm text-center font-mono text-h4 text-weight-bolder text-slate-900 shadow-sm">
                    {{ marcadorLocal }}
                  </div>
                </div>
                <div class="col-12 col-sm-2 text-center text-weight-bolder text-grey-5 text-h5">
                  VS
                </div>
                <div class="col-12 col-sm-5 text-center">
                  <div class="text-caption text-weight-bold text-indigo-8 q-mb-xs">
                    {{ esLocal ? rivalDelPartido?.nombre : equipoActual?.nombre }} (Visitante)
                  </div>
                  <div class="bg-white border rounded-borders q-pa-sm text-center font-mono text-h4 text-weight-bolder text-slate-900 shadow-sm">
                    {{ marcadorVisitante }}
                  </div>
                </div>
              </div>

              <div class="text-caption text-slate-800 bg-emerald-50 q-pa-sm rounded-borders border border-emerald-3 text-center">
                ⚽ Goles oficiales registrados para tu club ({{ equipoActual?.nombre }}): <strong>{{ golesMiEquipoOficial }} gol(es)</strong>. Asigna a continuación quiénes fueron los autores.
              </div>

              <!-- Goleadores de tu equipo -->
              <div class="q-pt-sm border-t">
                <div class="row items-center justify-between q-mb-sm">
                  <div>
                    <div class="text-subtitle2 text-weight-bold text-slate-800">
                      3. Autores de los Goles de {{ equipoActual?.nombre }}:
                    </div>
                    <div class="text-caption text-grey-6">
                      Indica qué futbolistas de tu plantel hicieron los goles.
                    </div>
                  </div>
                  <q-btn
                    unelevated
                    dense
                    no-caps
                    color="primary"
                    :icon="matAdd"
                    label="+ Añadir Goleador"
                    class="q-px-sm text-weight-bold text-caption"
                    @click="agregarFilaGoleador"
                  />
                </div>

                <div v-if="!filasGoleadores.length" class="text-center q-pa-md bg-white rounded-borders border text-grey-6 text-caption">
                  Aún no has agregado autores de goles. Haz clic en "+ Añadir Goleador" para seleccionar jugadores.
                </div>

                <div v-else class="q-gutter-y-xs">
                  <div
                    v-for="(fila, idx) in filasGoleadores"
                    :key="idx"
                    class="row items-center q-col-gutter-sm bg-white q-pa-xs rounded-borders border"
                  >
                    <div class="col-12 col-sm-6">
                      <q-select
                        v-model="fila.jugadorId"
                        :options="opcionesJugadoresClub"
                        emit-value
                        map-options
                        outlined
                        dense
                        placeholder="Selecciona jugador"
                        style="font-size: 12px"
                      />
                    </div>
                    <div class="col-6 col-sm-3">
                      <q-input
                        v-model.number="fila.goles"
                        type="number"
                        min="1"
                        outlined
                        dense
                        label="Goles"
                        style="font-size: 12px"
                      />
                    </div>
                    <div class="col-5 col-sm-2">
                      <q-input
                        v-model="fila.minuto"
                        outlined
                        dense
                        label="Minuto (opc.)"
                        placeholder="Ej: 24'"
                        style="font-size: 12px"
                      />
                    </div>
                    <div class="col-1 text-right">
                      <q-btn
                        flat
                        round
                        dense
                        size="xs"
                        color="negative"
                        :icon="matDelete"
                        @click="quitarFilaGoleador(idx)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Botón Enviar Planilla -->
              <div class="row items-center justify-between q-pt-md border-t">
                <div class="text-caption text-grey-7">
                  ℹ️ Al confirmar, los goles se registrarán en la tabla y se enviará la alerta oficial al Administrador.
                </div>
                <q-btn
                  unelevated
                  no-caps
                  color="amber-9"
                  text-color="white"
                  :icon="matSend"
                  label="Enviar Planilla y Notificar al Administrador"
                  class="text-weight-bolder shadow-1 q-px-md"
                  :loading="enviandoPlanilla"
                  @click="enviarPlanillaGoleadores"
                />
              </div>
            </div>
          </div>
        </q-card>
      </div>
    </div>

    <!-- Modal para Personalizar Escudo Oficial del Club -->
    <q-dialog v-model="modalEscudo">
      <q-card style="width: 500px; max-width: 95vw;" class="rounded-borders bg-white">
        <q-card-section class="bg-slate-900 text-white row items-center justify-between q-py-sm">
          <div class="row items-center q-gutter-xs">
            <q-icon :name="matShield" color="positive" size="20px" />
            <span class="text-subtitle2 text-weight-bold">Escudo Oficial de {{ equipoActual?.nombre }}</span>
          </div>
          <q-btn flat round dense :icon="matClose" v-close-popup text-color="grey-4" />
        </q-card-section>

        <q-card-section class="q-pa-md q-gutter-y-sm">
          <!-- Vista Previa -->
          <div class="row items-center q-gutter-md bg-slate-50 q-pa-md rounded-borders border">
            <div
              class="escudo-preview-box flex flex-center rounded-borders shadow-1"
              :style="{ backgroundColor: formEscudo.color || '#059669' }"
            >
              <img
                v-if="formEscudo.url"
                :src="formEscudo.url"
                alt="Escudo"
                class="escudo-preview-img"
              />
              <span v-else class="text-h5">{{ formEscudo.figura || '🛡️' }}</span>
            </div>
            <div class="col">
              <div class="text-subtitle2 text-weight-bolder text-slate-900">{{ equipoActual?.nombre }}</div>
              <div class="text-caption text-grey-6 font-11">
                {{ formEscudo.url ? 'Imagen personalizada activa' : `Figura emblema: ${formEscudo.figura}` }}
              </div>
            </div>
          </div>

          <!-- Selector con pestañas: Figuras, Subir Archivo, Pegar URL -->
          <q-tabs
            v-model="tabModalEscudo"
            dense
            no-caps
            active-color="positive"
            indicator-color="positive"
            class="text-grey-7 border-b font-11"
            align="justify"
          >
            <q-tab name="figuras" label="Figuras Prediseñadas" />
            <q-tab name="subir" label="Subir desde Computadora" />
            <q-tab name="url" label="Pegar Enlace Web" />
          </q-tabs>

          <q-tab-panels v-model="tabModalEscudo" animated class="q-pa-none bg-transparent">
            <!-- Pestaña 1: Figuras -->
            <q-tab-panel name="figuras" class="q-pa-none">
              <div class="text-caption text-weight-medium text-grey-7 q-mb-xs font-11">Elige un emblema:</div>
              <div class="row q-col-gutter-xs q-mb-sm">
                <div
                  v-for="fig in figurasEscudoDisponibles"
                  :key="fig.emoji"
                  class="col-2 text-center"
                >
                  <div
                    class="cursor-pointer q-pa-xs rounded-borders text-center border transition-all"
                    :class="formEscudo.figura === fig.emoji && !formEscudo.url ? 'bg-emerald-1 border-emerald-6 shadow-1' : 'bg-white border-grey-3'"
                    @click="formEscudo.figura = fig.emoji; formEscudo.url = ''"
                  >
                    <span class="text-subtitle1">{{ fig.emoji }}</span>
                  </div>
                </div>
              </div>

              <div class="text-caption text-weight-medium text-grey-7 q-mb-xs font-11">Color de fondo:</div>
              <div class="row q-gutter-xs items-center">
                <div
                  v-for="c in coloresEscudoDisponibles"
                  :key="c"
                  class="color-dot cursor-pointer shadow-1"
                  :style="{ backgroundColor: c }"
                  :class="{ 'ring-active': formEscudo.color === c }"
                  @click="formEscudo.color = c"
                />
              </div>
            </q-tab-panel>

            <!-- Pestaña 2: Subir Archivo -->
            <q-tab-panel name="subir" class="q-pa-xs text-center">
              <div class="text-caption text-grey-7 q-mb-sm font-11">
                Selecciona una foto o imagen de escudo guardada en tu computadora:
              </div>
              <input
                type="file"
                id="modalArchivoEscudoInput"
                accept="image/*"
                style="display: none;"
                @change="cargarArchivoEscudoModal"
              />
              <q-btn
                unelevated
                dense
                no-caps
                color="positive"
                :icon="matCloudUpload"
                label="Elegir Archivo de Imagen"
                class="q-px-md text-weight-bold font-12"
                onclick="document.getElementById('modalArchivoEscudoInput').click()"
              />
              <div v-if="formEscudo.url" class="q-mt-xs">
                <q-btn
                  flat
                  dense
                  no-caps
                  size="xs"
                  color="negative"
                  label="Quitar imagen cargada"
                  @click="formEscudo.url = ''"
                />
              </div>
            </q-tab-panel>

            <!-- Pestaña 3: Pegar URL -->
            <q-tab-panel name="url" class="q-pa-none">
              <div class="text-caption text-grey-7 q-mb-xs font-11">
                Pega la dirección de internet (URL) de la imagen de tu escudo:
              </div>
              <q-input
                v-model="formEscudo.url"
                outlined
                dense
                bg-color="white"
                placeholder="https://ejemplo.com/escudo.png"
              >
                <template #append v-if="formEscudo.url">
                  <q-btn flat round dense size="xs" :icon="matClose" @click="formEscudo.url = ''" />
                </template>
              </q-input>
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md bg-grey-1">
          <q-btn flat no-caps label="Cancelar" v-close-popup color="grey-7" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Guardar Escudo Oficial"
            :icon="matCheck"
            class="text-weight-bold"
            @click="guardarEscudo"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useTorneo } from '../torneo.js'
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
  matInfo,
  matMilitaryTech,
  matShield,
  matSportsSoccer,
  matCalendarMonth,
  matAdd,
  matDelete,
  matSend,
  matCloudUpload,
  matClose,
  matCheck
} from '@quasar/extras/material-icons'

const store = useTorneo()
const roleStore = store

const tabVista = ref('pizarra')
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

const selectorOrganizadorId = ref('')

// Para el entrenador y el jugador, el club está estrictamente fijado a su equipo responsable
const equipoSeleccionadoId = computed({
  get: () => {
    if (store.esEntrenador || store.esJugador) {
      return String(store.miEquipoId || '').trim()
    }
    return String(selectorOrganizadorId.value || store.miEquipoId || store.equipos[0]?.id || '').trim()
  },
  set: (val) => {
    if (store.esOrganizador) {
      selectorOrganizadorId.value = val
    }
  }
})

// Solo el Director Técnico del club responsable puede modificar la pizarra táctica
const puedeEditarPizarra = computed(() => {
  return store.esEntrenador && Boolean(store.miEquipoId && String(store.miEquipoId).trim() === String(equipoSeleccionadoId.value).trim())
})

const golesMiEquipoOficial = computed(() => {
  if (!partidoSeleccionado.value) return 0
  return esLocal.value ? Number(marcadorLocal.value || 0) : Number(marcadorVisitante.value || 0)
})

const equipoActual = computed(() =>
  store.equipos.find(e => String(e.id || e._id || '').trim() === String(equipoSeleccionadoId.value).trim())
)

const jugadoresDelEquipo = computed(() => {
  const targetId = String(equipoSeleccionadoId.value || '').trim()
  if (!targetId) return []
  return store.jugadores.filter(j => {
    const eqId = j.equipoId || (j.equipo && typeof j.equipo === 'object' ? (j.equipo._id || j.equipo.id) : j.equipo)
    return String(eqId || '').trim() === targetId
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

// CAPITÁN DE EQUIPO (Regla Oficial)
const capitanActual = computed(() => {
  return store.capitanDelEquipo(equipoSeleccionadoId.value)
})

const tieneCapitanAsignado = computed(() => {
  return store.tieneCapitan(equipoSeleccionadoId.value)
})

function esElCapitan(j) {
  if (j.esCapitan) return true
  if (equipoActual.value?.capitan && (equipoActual.value.capitan === j.nombre || equipoActual.value.capitanId === (j.id || j._id))) return true
  return false
}

async function nombrarCapitan(j) {
  if (!puedeEditarPizarra.value) return
  try {
    await store.designarCapitan(j.id || j._id, equipoSeleccionadoId.value)
    mensajeExito.value = `¡${j.nombre} ha sido nombrado Capitán oficial (Ⓒ)! Equipo reglamentariamente habilitado para jugar.`
    setTimeout(() => {
      mensajeExito.value = ''
    }, 4500)
  } catch (err) {
    console.error('Error al designar capitán:', err)
  }
}

// PERSONALIZAR ESCUDO DEL CLUB
const modalEscudo = ref(false)
const tabModalEscudo = ref('figuras')
const formEscudo = ref({
  figura: '🛡️',
  url: '',
  color: '#059669'
})

const figurasEscudoDisponibles = [
  { emoji: '🛡️', label: 'Escudo' },
  { emoji: '🦅', label: 'Águilas' },
  { emoji: '🦁', label: 'Leones' },
  { emoji: '⚡', label: 'Rayos' },
  { emoji: '⚽', label: 'Balón' },
  { emoji: '👑', label: 'Corona' },
  { emoji: '🐯', label: 'Tigres' },
  { emoji: '🐺', label: 'Lobos' },
  { emoji: '🏆', label: 'Copa' },
  { emoji: '⚔️', label: 'Gladiadores' },
  { emoji: '🐉', label: 'Dragones' },
  { emoji: '🥊', label: 'Guerreros' },
  { emoji: '🦈', label: 'Tiburones' },
  { emoji: '🐆', label: 'Panteras' },
  { emoji: '🎯', label: 'Diana' },
  { emoji: '🔥', label: 'Fuego' },
  { emoji: '🏟️', label: 'Estadio' },
  { emoji: '🥇', label: 'Campeón' }
]

const coloresEscudoDisponibles = [
  '#059669', '#dc2626', '#2563eb', '#d97706', '#7c3aed',
  '#0f172a', '#e11d48', '#0891b2', '#16a34a', '#475569'
]

function abrirEditorEscudo() {
  if (!equipoActual.value) return
  formEscudo.value = {
    figura: equipoActual.value.escudoFigura || '🛡️',
    url: equipoActual.value.escudoUrl || '',
    color: equipoActual.value.escudocolor || '#059669'
  }
  modalEscudo.value = true
}

function cargarArchivoEscudoModal(e) {
  const file = e.target?.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    formEscudo.value.url = ev.target.result
  }
  reader.readAsDataURL(file)
}

async function guardarEscudo() {
  if (!equipoSeleccionadoId.value) return
  try {
    await store.actualizarEscudoEquipo(equipoSeleccionadoId.value, {
      escudoFigura: formEscudo.value.figura,
      escudoUrl: formEscudo.value.url,
      escudocolor: formEscudo.value.color
    })
    modalEscudo.value = false
    mensajeExito.value = '¡Escudo del club actualizado exitosamente!'
    setTimeout(() => { mensajeExito.value = '' }, 3500)
  } catch (err) {
    console.error('Error al actualizar escudo:', err)
  }
}

// REPORTAR GOLEADORES DEL PARTIDO
const partidoReporteId = ref('')
const marcadorLocal = ref(0)
const marcadorVisitante = ref(0)
const filasGoleadores = ref([])
const enviandoPlanilla = ref(false)

const partidosDelClub = computed(() => {
  const targetId = String(equipoSeleccionadoId.value || '').trim()
  if (!targetId) return []
  return store.partidos.filter(p => {
    const loc = String(p.localId || (p.local && typeof p.local === 'object' ? (p.local._id || p.local.id) : p.local) || '').trim()
    const vis = String(p.visitanteId || (p.visitante && typeof p.visitante === 'object' ? (p.visitante._id || p.visitante.id) : p.visitante) || '').trim()
    return loc === targetId || vis === targetId
  })
})

const opcionesPartidosReporte = computed(() =>
  partidosDelClub.value.map(p => {
    const locNom = store.equipoPorId(p.localId)?.nombre || 'Local'
    const visNom = store.equipoPorId(p.visitanteId)?.nombre || 'Visitante'
    return {
      label: `${locNom} vs ${visNom} (Jornada ${p.fecha})`,
      value: p.id || p._id,
      jornada: p.fecha,
      estado: p.estado || 'Programado'
    }
  })
)

watch(partidosDelClub, (partidos) => {
  if (partidos.length && !partidoReporteId.value) {
    partidoReporteId.value = partidos[0].id || partidos[0]._id
  }
}, { immediate: true })

watch(() => store.miEquipoId, () => {
  partidoReporteId.value = ''
  filasGoleadores.value = []
})

const partidoSeleccionado = computed(() =>
  partidosDelClub.value.find(p => (p.id || p._id) === partidoReporteId.value)
)

const esLocal = computed(() => {
  const targetId = String(equipoSeleccionadoId.value || '').trim()
  if (!partidoSeleccionado.value || !targetId) return true
  const loc = String(partidoSeleccionado.value.localId || (partidoSeleccionado.value.local?._id || partidoSeleccionado.value.local) || '').trim()
  return loc === targetId
})

const rivalDelPartido = computed(() => {
  if (!partidoSeleccionado.value) return null
  const rivalId = esLocal.value ? partidoSeleccionado.value.visitanteId : partidoSeleccionado.value.localId
  return store.equipoPorId(rivalId)
})

watch(partidoSeleccionado, (nuevo) => {
  if (nuevo) {
    marcadorLocal.value = Number(nuevo.golesLocal ?? nuevo.goles_local ?? 0)
    marcadorVisitante.value = Number(nuevo.golesVisitante ?? nuevo.goles_visitante ?? 0)
    if (Array.isArray(nuevo.goleadores) && nuevo.goleadores.length) {
      filasGoleadores.value = nuevo.goleadores.map(g => ({
        jugadorId: g.jugadorId || g.jugador?._id || g.jugador || '',
        goles: Number(g.goles || 1),
        minuto: g.minuto || ''
      }))
    } else {
      filasGoleadores.value = []
    }
  }
}, { immediate: true })

const opcionesJugadoresClub = computed(() =>
  jugadoresDelEquipo.value.map(j => ({
    label: `#${j.numero || j.dorsal || '-'} ${j.nombre} ${j.apellido || ''} (${j.posicion || 'Delantero'})`,
    value: j.id || j._id
  }))
)

function agregarFilaGoleador() {
  const primerJugador = jugadoresDelEquipo.value[0]?.id || ''
  filasGoleadores.value.push({
    jugadorId: primerJugador,
    goles: 1,
    minuto: ''
  })
}

function quitarFilaGoleador(idx) {
  filasGoleadores.value.splice(idx, 1)
}

async function enviarPlanillaGoleadores() {
  if (!partidoSeleccionado.value) return
  if (!tieneCapitanAsignado.value) {
    mensajeExito.value = '⚠️ No se puede enviar la planilla: El club debe tener un Capitán oficial designado.'
    return
  }

  enviandoPlanilla.value = true
  try {
    const listaReporte = filasGoleadores.value.filter(f => f.jugadorId).map(f => {
      const jug = jugadoresDelEquipo.value.find(j => (j.id || j._id) === f.jugadorId)
      return {
        jugadorId: f.jugadorId,
        nombre: jug ? `${jug.nombre} ${jug.apellido || ''}`.trim() : 'Jugador',
        dorsal: jug?.numero || jug?.dorsal || '-',
        goles: Number(f.goles) || 1,
        minuto: f.minuto || ''
      }
    })

    const golesClub = esLocal.value ? marcadorLocal.value : marcadorVisitante.value
    const golesRival = esLocal.value ? marcadorVisitante.value : marcadorLocal.value
    const rivalId = esLocal.value ? partidoSeleccionado.value.visitanteId : partidoSeleccionado.value.localId

    await store.registrarGoleadoresDT({
      partidoId: partidoSeleccionado.value.id || partidoSeleccionado.value._id,
      equipoId: equipoSeleccionadoId.value,
      equipoNombre: equipoActual.value?.nombre || 'Club',
      dtNombre: store.user?.usuario || 'Director Técnico',
      goleadores: listaReporte,
      golesClub,
      golesRival,
      rivalId,
      rivalNombre: rivalDelPartido.value?.nombre || 'Rival',
      jornada: partidoSeleccionado.value.fecha || 1
    })

    mensajeExito.value = '⚽ ¡Planilla de goleadores registrada y notificación oficial enviada al Administrador!'
    setTimeout(() => {
      mensajeExito.value = ''
    }, 5000)
  } catch (err) {
    console.error('Error al registrar goleadores:', err)
  } finally {
    enviandoPlanilla.value = false
  }
}

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
  if (!equipoSeleccionadoId.value || !puedeEditarPizarra.value) return
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
  if (!puedeEditarPizarra.value) return
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

.ring-captain {
  border: 3px solid #fbbf24 !important;
  box-shadow: 0 0 10px rgba(251, 191, 36, 0.8) !important;
}

.escudo-preview-box {
  width: 52px;
  height: 52px;
  overflow: hidden;
}

.escudo-preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.color-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #ffffff;
}

.color-dot.ring-active {
  outline: 2px solid #0f172a;
}
</style>
