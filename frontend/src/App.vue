<template>
  <q-layout view="hHh lpr fFf" class="app-layout">
    <!-- PANTALLA DE ACCESO OBLIGATORIA (Si no inicia sesión, no entra al sistema) -->
    <div v-if="!store.isAuthenticated" class="login-gatekeeper-page flex flex-center q-pa-md">
      <q-card style="width: 500px; max-width: 95vw;" class="rounded-borders bg-white shadow-10 overflow-hidden login-card">
        <!-- Encabezado de la Pantalla de Ingreso -->
        <div class="login-card-header q-pa-lg text-center">
          <div class="brand-crest-wrapper q-mx-auto q-mb-sm">
            <img
              src="/assets/images/league_crest_badge_1790957070182.jpg"
              alt="Logo"
              class="brand-crest-img"
              referrerPolicy="no-referrer"
            />
          </div>
          <div class="text-h5 text-weight-bolder letter-spacing-1 text-white q-mt-xs">FUTBOLITO</div>
          <div class="text-caption text-emerald-400 text-weight-bold q-mt-xs">
            Control de Acceso Oficial · Liga Barrial
          </div>
          <div class="text-caption text-slate-300 q-mt-xs font-mono font-11">
            Inicia sesión con tu cuenta o regístrate para ingresar
          </div>

          <q-tabs
            v-model="tabAcceso"
            dense
            no-caps
            class="login-header-tabs q-mt-md"
            active-color="positive"
            indicator-color="positive"
            align="justify"
          >
            <q-tab name="login" :icon="matLogin" label="Iniciar Sesión" class="text-weight-bold" />
            <q-tab name="registro" :icon="matPersonAdd" label="Crear Cuenta" class="text-weight-bold" />
          </q-tabs>
        </div>

        <!-- Banner de Error si ocurre -->
        <q-banner v-if="errorAcceso" dense class="bg-negative text-white q-px-md q-py-sm">
          <template #avatar>
            <q-icon :name="matErrorOutline" />
          </template>
          <span class="text-caption text-weight-medium">{{ errorAcceso }}</span>
        </q-banner>

        <q-tab-panels v-model="tabAcceso" animated class="q-pa-lg">
          <!-- PANEL 1: INICIAR SESIÓN -->
          <q-tab-panel name="login" class="q-pa-none">
            <form @submit.prevent="ejecutarLogin" class="q-gutter-y-md">
              <div>
                <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">Usuario</div>
                <q-input
                  v-model="loginForm.usuario"
                  outlined
                  dense
                  bg-color="white"
                  placeholder="Tu nombre de usuario"
                  autofocus
                  :rules="[val => !!val || 'El usuario es obligatorio']"
                >
                  <template #prepend>
                    <q-icon :name="matPerson" color="grey-6" />
                  </template>
                </q-input>
              </div>

              <div>
                <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">Contraseña</div>
                <q-input
                  v-model="loginForm.password"
                  :type="verPasswordLogin ? 'text' : 'password'"
                  outlined
                  dense
                  bg-color="white"
                  placeholder="Tu contraseña secreta"
                  :rules="[val => !!val || 'La contraseña es obligatoria']"
                >
                  <template #prepend>
                    <q-icon :name="matLock" color="grey-6" />
                  </template>
                  <template #append>
                    <q-btn
                      flat
                      round
                      dense
                      size="sm"
                      :icon="verPasswordLogin ? matVisibilityOff : matVisibility"
                      color="grey-6"
                      @click="verPasswordLogin = !verPasswordLogin"
                    />
                  </template>
                </q-input>
              </div>

              <q-btn
                type="submit"
                color="primary"
                unelevated
                no-caps
                class="full-width q-py-sm text-weight-bold shadow-1"
                :loading="store.cargando"
                label="Ingresar al Sistema"
                :icon="matLogin"
              />

              <div class="text-center q-pt-xs">
                <span class="text-caption text-grey-7">¿No tienes cuenta registrada? </span>
                <q-btn
                  flat
                  dense
                  no-caps
                  color="primary"
                  label="Crear cuenta nueva"
                  class="text-weight-bold text-caption"
                  @click="tabAcceso = 'registro'"
                />
              </div>
            </form>
          </q-tab-panel>

          <!-- PANEL 2: REGISTRO -->
          <q-tab-panel name="registro" class="q-pa-none">
            <form @submit.prevent="ejecutarRegistro" class="q-gutter-y-sm">
              <!-- Selección de Rol -->
              <div>
                <div class="text-caption text-weight-bolder text-grey-9 q-mb-xs">
                  Selecciona tu Rol:
                </div>
                <div class="row q-col-gutter-xs">
                  <div class="col-4">
                    <q-card
                      flat
                      bordered
                      class="cursor-pointer text-center q-pa-sm"
                      :class="registroForm.rol === 'organizador' ? 'bg-amber-1 border-amber-8 text-amber-10 shadow-2 text-weight-bolder' : 'bg-grey-1 text-grey-8'"
                      @click="seleccionarRolRegistro('organizador')"
                    >
                      <div class="text-subtitle2 text-weight-bold">👑 Organizador</div>
                    </q-card>
                  </div>
                  <div class="col-4">
                    <q-card
                      flat
                      bordered
                      class="cursor-pointer text-center q-pa-sm"
                      :class="registroForm.rol === 'entrenador' ? 'bg-emerald-1 border-emerald-8 text-emerald-10 shadow-2 text-weight-bolder' : 'bg-grey-1 text-grey-8'"
                      @click="seleccionarRolRegistro('entrenador')"
                    >
                      <div class="text-subtitle2 text-weight-bold">📋 Entrenador</div>
                    </q-card>
                  </div>
                  <div class="col-4">
                    <q-card
                      flat
                      bordered
                      class="cursor-pointer text-center q-pa-sm"
                      :class="registroForm.rol === 'jugador' ? 'bg-indigo-1 border-indigo-8 text-indigo-10 shadow-2 text-weight-bolder' : 'bg-grey-1 text-grey-8'"
                      @click="seleccionarRolRegistro('jugador')"
                    >
                      <div class="text-subtitle2 text-weight-bold">⚽ Jugador</div>
                    </q-card>
                  </div>
                </div>
              </div>

              <!-- Nombre y Usuario -->
              <div class="row q-col-gutter-xs">
                <div class="col-6">
                  <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">Usuario *</div>
                  <q-input
                    v-model="registroForm.usuario"
                    dense
                    outlined
                    bg-color="white"
                    placeholder="Ej: admin1"
                    :rules="[val => !!val && val.length >= 3 || 'Mínimo 3 letras']"
                  />
                </div>
                <div class="col-6">
                  <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">Nombre Completo</div>
                  <q-input
                    v-model="registroForm.nombre"
                    dense
                    outlined
                    bg-color="white"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
              </div>

              <!-- Contraseña de Cuenta -->
              <div>
                <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">Contraseña de Cuenta *</div>
                <q-input
                  v-model="registroForm.password"
                  :type="verPasswordReg ? 'text' : 'password'"
                  outlined
                  dense
                  bg-color="white"
                  placeholder="Mínimo 4 caracteres"
                  :rules="[val => !!val && val.length >= 4 || 'Mínimo 4 caracteres']"
                >
                  <template #append>
                    <q-btn
                      flat
                      round
                      dense
                      size="sm"
                      :icon="verPasswordReg ? matVisibilityOff : matVisibility"
                      color="grey-6"
                      @click="verPasswordReg = !verPasswordReg"
                    />
                  </template>
                </q-input>
              </div>

              <!-- CONDICIONAL SEGÚN ROL -->

              <!-- CASO 1: Entrenador (Obligatorio crear un equipo propio único) -->
              <div v-if="registroForm.rol === 'entrenador'" class="q-gutter-y-xs bg-emerald-50 q-pa-sm rounded-borders border-emerald-8">
                <div class="row items-center justify-between">
                  <span class="text-caption text-weight-bolder text-emerald-10">
                    🛡️ Nombre de tu Nuevo Club * (Obligatorio)
                  </span>
                  <q-badge color="positive" text-color="white">1 DT por club</q-badge>
                </div>
                <q-input
                  v-model="registroForm.nombreEquipo"
                  outlined
                  dense
                  bg-color="white"
                  placeholder="Ej: Huracán del Norte"
                  :rules="[val => !!val && val.trim().length >= 3 || 'Debes ingresar el nombre de tu equipo (mínimo 3 letras)']"
                >
                  <template #prepend>
                    <q-icon :name="matShield" color="positive" />
                  </template>
                </q-input>

                <div class="row q-col-gutter-xs">
                  <div class="col-12">
                    <q-input
                      v-model="registroForm.barriada"
                      outlined
                      dense
                      bg-color="white"
                      placeholder="Barrio / Sector (Ej: Barrio Norte)"
                    />
                  </div>
                </div>
                <div class="text-caption text-grey-8 font-11">
                  💡 Solo habrá un entrenador por equipo. Fundarás este club y serás su único director técnico.
                </div>
              </div>

              <!-- CASO 2: Jugador (Obligatorio escoger club de la plataforma y su posición táctica) -->
              <div v-else-if="registroForm.rol === 'jugador'" class="q-gutter-y-sm bg-indigo-50 q-pa-sm rounded-borders border border-indigo-2">
                <div class="row items-center justify-between">
                  <span class="text-caption text-weight-bolder text-indigo-9">
                    ⚽ 1. Escoger Club de la Plataforma * (Obligatorio)
                  </span>
                  <q-badge color="indigo-7" text-color="white">
                    {{ store.equipos.length }} clubes en torneo
                  </q-badge>
                </div>
                <q-select
                  v-model="registroForm.equipo"
                  :options="opcionesEquipos"
                  outlined
                  dense
                  emit-value
                  map-options
                  bg-color="white"
                  placeholder="Selecciona el club en el que jugarás"
                  :rules="[val => !!val || 'Debes escoger un club obligatorio']"
                >
                  <template #prepend>
                    <q-icon :name="matShield" color="indigo-7" />
                  </template>
                  <template #no-option>
                    <q-item>
                      <q-item-section class="text-grey-8 text-caption">
                        No hay clubes registrados todavía. Un entrenador debe registrar su club primero.
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>

                <!-- Selección de Posición Táctica (Obligatorio) -->
                <div>
                  <div class="row items-center justify-between q-mb-xs">
                    <span class="text-caption text-weight-bolder text-indigo-9">
                      📍 2. Elige tu Posición en la Cancha * (Obligatorio)
                    </span>
                    <q-badge color="indigo-9" class="text-weight-bold">
                      {{ registroForm.posicion || 'Elige posición' }}
                    </q-badge>
                  </div>

                  <div class="row q-col-gutter-xs">
                    <div
                      v-for="pos in opcionesPosiciones"
                      :key="pos.value"
                      class="col-6"
                    >
                      <div
                        class="cursor-pointer text-center q-pa-xs rounded-borders transition-all border"
                        :class="registroForm.posicion === pos.value ? 'bg-indigo-7 text-white shadow-1 border-indigo-9' : 'bg-white text-slate-800 border-indigo-2'"
                        @click="registroForm.posicion = pos.value"
                        style="min-height: 48px; display: flex; flex-direction: column; justify-content: center;"
                      >
                        <div class="text-caption text-weight-bolder ellipsis">{{ pos.label }}</div>
                        <div class="font-10 ellipsis" :class="registroForm.posicion === pos.value ? 'text-indigo-1' : 'text-grey-6'">
                          {{ pos.desc }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="text-caption text-grey-8 font-11">
                  💡 Quedarás registrado en la nómina oficial del club con tu posición asignada para la pizarra táctica del DT.
                </div>
              </div>

              <!-- CASO 3: Organizador -->
              <div v-else class="bg-amber-1 q-pa-sm rounded-borders border-amber-8">
                <div class="text-caption text-weight-bold text-amber-10">
                  👑 Administrador de la Liga Barrial
                </div>
                <div class="text-caption text-grey-8 font-11">
                  Control general de la programación, actas y tabla general.
                </div>
              </div>

              <q-btn
                type="submit"
                color="primary"
                unelevated
                no-caps
                class="full-width q-py-sm text-weight-bold shadow-1 q-mt-sm"
                :loading="store.cargando"
                label="Crear Cuenta e Ingresar"
                :icon="matPersonAdd"
              />

              <div class="text-center q-pt-xs">
                <span class="text-caption text-grey-7">¿Ya tienes cuenta? </span>
                <q-btn
                  flat
                  dense
                  no-caps
                  color="primary"
                  label="Inicia sesión aquí"
                  class="text-weight-bold text-caption"
                  @click="tabAcceso = 'login'"
                />
              </div>
            </form>
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </div>

    <!-- APLICACIÓN COMPLETA (Solo visible una vez autenticado) -->
    <template v-else>
      <!-- Navbar Oficial -->
      <q-header class="bg-dark-header text-white">
        <div class="container">
          <div class="header-nav-row row items-center justify-between no-wrap q-py-sm">
            <!-- Zona 1: Brand & Status -->
            <div class="row items-center no-wrap brand-zone">
              <div class="brand-crest-wrapper q-mr-sm">
                <img
                  src="/assets/images/league_crest_badge_1790957070182.jpg"
                  alt="Logo"
                  class="brand-crest-img"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div class="brand-title">FUTBOLITO</div>
                <div class="row items-center no-wrap">
                  <span class="live-pulse q-mr-xs" />
                  <span class="text-caption text-grey-4 font-mono font-11">MongoDB Atlas</span>
                </div>
              </div>
            </div>

            <!-- Zona 2: Navegación Central -->
            <div class="nav-links-zone hidden lg:flex items-center">
              <q-tabs
                dense
                no-caps
                active-color="emerald-400"
                indicator-color="primary"
                class="text-grey-4 header-tabs"
              >
                <q-route-tab to="/" exact :icon="matTableChart" label="Posiciones" />
                <q-route-tab to="/fixture" :icon="matCalendarMonth" label="Fixture" />
                <q-route-tab to="/equipos" :icon="matShield" label="Clubes" />
                <q-route-tab to="/ranking" :icon="matMilitaryTech" label="Goleadores" />
                <q-route-tab
                  to="/entrenador"
                  :icon="matSports"
                  label="Pizarra DT"
                  :class="{ 'text-positive text-weight-bold': store.esEntrenador }"
                />
              </q-tabs>
            </div>

            <!-- Zona 3: Selector de Rol y Usuario Logueado con Salir -->
            <div class="row items-center q-gutter-xs no-wrap">
              <!-- Selector de Rol Interactivo -->
              <q-btn-dropdown
                unelevated
                dense
                no-caps
                class="role-dropdown-btn q-px-sm"
                :class="roleColorClass"
                :label="store.rolInfo.badge"
              >
                <q-list style="min-width: 220px" class="q-py-xs">
                  <q-item-label header class="text-caption text-weight-bolder text-grey-8">
                    SELECCIONAR ROL
                  </q-item-label>

                  <q-item
                    clickable
                    v-close-popup
                    :active="store.esOrganizador"
                    active-class="bg-amber-1 text-amber-10"
                    @click="cambiarRolDirecto('organizador')"
                  >
                    <q-item-section avatar style="min-width: 32px">
                      <span>👑</span>
                    </q-item-section>
                    <q-item-section>
                      <span class="text-weight-bold">Organizador</span>
                    </q-item-section>
                  </q-item>

                  <q-item
                    clickable
                    v-close-popup
                    :active="store.esEntrenador"
                    active-class="bg-emerald-1 text-emerald-10"
                    @click="cambiarRolDirecto('entrenador')"
                  >
                    <q-item-section avatar style="min-width: 32px">
                      <span>📋</span>
                    </q-item-section>
                    <q-item-section>
                      <span class="text-weight-bold">Entrenador (DT)</span>
                    </q-item-section>
                  </q-item>

                  <q-item
                    clickable
                    v-close-popup
                    :active="store.esJugador"
                    active-class="bg-indigo-1 text-indigo-10"
                    @click="cambiarRolDirecto('jugador')"
                  >
                    <q-item-section avatar style="min-width: 32px">
                      <span>⚽</span>
                    </q-item-section>
                    <q-item-section>
                      <span class="text-weight-bold">Jugador</span>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>

              <!-- Perfil del Usuario Activo -->
              <div class="row items-center no-wrap q-ml-xs bg-slate-800 q-px-sm q-py-xs rounded-borders">
                <q-avatar size="24px" color="positive" text-color="white" class="q-mr-xs">
                  <span class="text-weight-bold font-mono">{{ ((store.nombreDisplay || 'U').charAt ? store.nombreDisplay.charAt(0) : 'U').toUpperCase() }}</span>
                </q-avatar>
                <span class="text-caption text-weight-bold ellipsis" style="max-width: 90px">
                  {{ store.user?.usuario }}
                </span>
              </div>

              <!-- Botón de Sincronización -->
              <q-btn
                flat
                round
                dense
                :icon="matRefresh"
                color="grey-4"
                :loading="store.cargando"
                @click="store.cargarTodo()"
              >
                <q-tooltip>Sincronizar datos</q-tooltip>
              </q-btn>

              <!-- Botón Cerrar Sesión (Vuelve a mostrar la pantalla de login) -->
              <q-btn
                unelevated
                dense
                no-caps
                color="negative"
                size="sm"
                :icon="matLogout"
                label="Salir"
                class="q-px-sm text-weight-bold q-ml-xs"
                @click="cerrarSesion"
              >
                <q-tooltip>Cerrar sesión y volver al ingreso</q-tooltip>
              </q-btn>
            </div>
          </div>

          <!-- Barra Móvil de Pestañas -->
          <div class="flex lg:hidden border-t-subtle q-py-xs overflow-x-auto">
            <q-tabs
              dense
              no-caps
              active-color="primary"
              indicator-color="primary"
              class="full-width text-grey-4"
            >
              <q-route-tab to="/" exact :icon="matTableChart" label="Posiciones" />
              <q-route-tab to="/fixture" :icon="matCalendarMonth" label="Fixture" />
              <q-route-tab to="/equipos" :icon="matShield" label="Clubes" />
              <q-route-tab to="/ranking" :icon="matMilitaryTech" label="Goleadores" />
              <q-route-tab to="/entrenador" :icon="matSports" label="Pizarra DT" />
            </q-tabs>
          </div>
        </div>
      </q-header>

      <q-page-container>
        <q-page class="container q-py-lg q-px-md">
          <!-- Banner de Error si falla la conexión -->
          <q-banner v-if="store.error" class="bg-negative text-white q-mb-md rounded-borders" rounded>
            Error de conexión con MongoDB: {{ store.error }}
            <template #action>
              <q-btn flat text-color="white" label="Reintentar" @click="store.cargarTodo()" />
            </template>
          </q-banner>

          <!-- Indicador de Carga -->
          <q-inner-loading :showing="store.cargando" color="primary" label="Cargando datos de Atlas..." />

          <!-- Vistas oficiales -->
          <router-view />
        </q-page>
      </q-page-container>

      <!-- Footer -->
      <q-footer class="bg-dark-footer text-grey-5 border-t-subtle">
        <div class="container q-py-md q-px-md row items-center justify-between q-gutter-md">
          <div class="row items-center no-wrap">
            <q-icon :name="matSportsSoccer" color="primary" size="20px" class="q-mr-sm" />
            <span class="text-white text-weight-bold">FUTBOLITO</span>
            <span class="q-ml-sm text-caption text-grey-6">· Sistema de Gestión de Torneos Barriales</span>
          </div>
          <div class="text-caption text-grey-6 font-mono">
            MongoDB Atlas Cloud Activo
          </div>
        </div>
      </q-footer>
    </template>

    <!-- Diálogos Globales -->
    <PartidoDialog v-model="store.dialogoPartido" />
    <EquipoDialog v-model="store.dialogoEquipo" />

    <!-- Diálogo de Confirmación de Rol al presionar ENTER -->
    <q-dialog v-model="mostrarAnuncioRol">
      <q-card style="width: 440px; max-width: 92vw;" class="rounded-borders text-center q-pa-lg">
        <q-avatar size="64px" :color="anuncioRolData.color" text-color="white" class="q-mb-md shadow-2">
          <span class="text-h4">{{ anuncioRolData.emoji }}</span>
        </q-avatar>
        <div class="text-h6 text-weight-bolder text-slate-900 q-mb-xs">
          {{ anuncioRolData.titulo }}
        </div>
        <div class="text-body2 text-grey-7 q-mb-lg">
          {{ anuncioRolData.descripcion }}
        </div>
        <q-btn
          unelevated
          no-caps
          :color="anuncioRolData.color"
          class="full-width text-weight-bold"
          label="Continuar"
          v-close-popup
        />
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useTorneo, ROLES } from './torneo.js'
import PartidoDialog from './components/PartidoDialog.vue'
import EquipoDialog from './components/EquipoDialog.vue'

// Quasar SVG Icons
import {
  matSportsSoccer,
  matTableChart,
  matCalendarMonth,
  matShield,
  matMilitaryTech,
  matGroupAdd,
  matRefresh,
  matSports,
  matLogin,
  matPersonAdd,
  matLogout,
  matKey,
  matPerson,
  matLock,
  matVisibility,
  matVisibilityOff,
  matErrorOutline,
  matCheckCircle
} from '@quasar/extras/material-icons'

const $q = useQuasar()
const store = useTorneo()
const router = useRouter()

// Control del Formulario de Ingreso Obligatorio
const tabAcceso = ref('login')
const errorAcceso = ref('')
const verPasswordLogin = ref(false)
const verPasswordReg = ref(false)

const loginForm = ref({
  usuario: '',
  password: ''
})

const registroForm = ref({
  usuario: '',
  password: '',
  nombre: '',
  rol: 'organizador',
  codigo: '1',
  equipo: null,
  nombreEquipo: '',
  barriada: '',
  posicion: 'Delantero'
})

const opcionesPosiciones = [
  { label: '🧤 Portero', value: 'Arquero', desc: 'Bajo los tres palos' },
  { label: '🛡️ Defensa', value: 'Defensor', desc: 'Recuperación y marca' },
  { label: '⚙️ Mediocampo', value: 'Mediocampista', desc: 'Creación y juego' },
  { label: '⚡ Delantero', value: 'Delantero', desc: 'Goles y ataque' }
]

const opcionesEquipos = computed(() =>
  store.equipos.map(e => ({
    label: e.nombre,
    value: e._id || e.id
  }))
)

function seleccionarRolRegistro(nuevoRol) {
  registroForm.value.rol = nuevoRol
  if (nuevoRol === 'organizador') registroForm.value.codigo = '1'
  else if (nuevoRol === 'entrenador') registroForm.value.codigo = '2'
  else if (nuevoRol === 'jugador') registroForm.value.codigo = '3'
}

async function ejecutarLogin() {
  errorAcceso.value = ''
  try {
    const res = await store.login({
      usuario: loginForm.value.usuario,
      password: loginForm.value.password
    })
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: `¡Bienvenido ${res.usuario.nombre || res.usuario.usuario}! Acceso concedido al torneo.`,
      position: 'top',
      timeout: 3500
    })
  } catch (err) {
    errorAcceso.value = err.message || 'Credenciales incorrectas'
  }
}

async function ejecutarRegistro() {
  errorAcceso.value = ''
  if (registroForm.value.rol === 'organizador') registroForm.value.codigo = '1'
  else if (registroForm.value.rol === 'entrenador') registroForm.value.codigo = '2'
  else if (registroForm.value.rol === 'jugador') registroForm.value.codigo = '3'

  if (registroForm.value.rol === 'entrenador') {
    if (!registroForm.value.nombreEquipo || registroForm.value.nombreEquipo.trim().length < 3) {
      errorAcceso.value = 'Como entrenador debes crear obligatoriamente un equipo propio (mínimo 3 caracteres).'
      return
    }
  }

  if (registroForm.value.rol === 'jugador') {
    if (!registroForm.value.equipo) {
      errorAcceso.value = 'Como jugador debes escoger obligatoriamente un equipo existente en la plataforma.'
      return
    }
    if (!registroForm.value.posicion) {
      errorAcceso.value = 'Como jugador debes escoger obligatoriamente tu posición táctica en el campo.'
      return
    }
  }

  try {
    const res = await store.registro({
      usuario: registroForm.value.usuario,
      password: registroForm.value.password,
      nombre: registroForm.value.nombre,
      rol: registroForm.value.rol,
      codigo: registroForm.value.codigo,
      equipo: registroForm.value.equipo,
      nombreEquipo: registroForm.value.nombreEquipo,
      barriada: registroForm.value.barriada,
      posicion: registroForm.value.posicion
    })
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: `¡Cuenta creada exitosamente! Rol: ${res.usuario.rol.toUpperCase()}`,
      position: 'top',
      timeout: 3500
    })
  } catch (err) {
    errorAcceso.value = err.message || 'Error al registrar la cuenta'
  }
}

function cerrarSesion() {
  store.logout()
  loginForm.value.password = ''
  tabAcceso.value = 'login'
  $q.notify({
    type: 'info',
    message: 'Has cerrado sesión. Ingresa tus credenciales para volver a entrar.',
    position: 'top',
    timeout: 3000
  })
}

const mostrarAnuncioRol = ref(false)
const anuncioRolData = ref({
  titulo: '',
  descripcion: '',
  color: 'primary',
  emoji: '⚽'
})

const roleColorClass = computed(() => {
  if (store.esOrganizador) return 'bg-amber-6 text-slate-900 font-bold'
  if (store.esEntrenador) return 'bg-emerald-6 text-white font-bold'
  return 'bg-indigo-6 text-white font-bold'
})

function cambiarRolDirecto(rol) {
  if (rol === 'organizador') {
    store.cambiarRol(ROLES.ORGANIZADOR)
    anuncioRolData.value = {
      titulo: 'Rol cambiado a ORGANIZADOR',
      descripcion: 'Acceso habilitado para programar partidos, crear torneos y asentar actas oficiales.',
      color: 'amber-9',
      emoji: '👑'
    }
    mostrarAnuncioRol.value = true
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: '¡Rol cambiado a Organizador!',
      position: 'top',
      timeout: 3000
    })
  } else if (rol === 'entrenador') {
    store.cambiarRol(ROLES.ENTRENADOR)
    anuncioRolData.value = {
      titulo: 'Rol cambiado a ENTRENADOR',
      descripcion: 'Acceso a la pizarra táctica para definir formaciones y posiciones de tus futbolistas.',
      color: 'positive',
      emoji: '📋'
    }
    mostrarAnuncioRol.value = true
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: '¡Rol cambiado a Entrenador!',
      position: 'top',
      timeout: 3000
    })
    router.push('/entrenador')
  } else if (rol === 'jugador') {
    store.cambiarRol(ROLES.JUGADOR)
    anuncioRolData.value = {
      titulo: 'Rol cambiado a JUGADOR',
      descripcion: 'Acceso para consultar planteles, alineaciones tácticas, fixture y estadísticas de tu club.',
      color: 'indigo-8',
      emoji: '⚽'
    }
    mostrarAnuncioRol.value = true
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: '¡Rol cambiado a Jugador!',
      position: 'top',
      timeout: 3000
    })
    router.push('/equipos')
  }
}

onMounted(() => {
  store.cargarTodo()
})
</script>

<style>
/* Reset y Tipografía */
body {
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  background-color: #f8fafc;
  color: #0f172a;
}
.font-mono {
  font-family: 'JetBrains Mono', monospace;
  font-variant-numeric: tabular-nums;
}
.font-11 {
  font-size: 11px;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Pantalla de Acceso */
.login-gatekeeper-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #090d16 0%, #064e3b 50%, #022c22 100%);
}
.login-card {
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
  border-radius: 16px;
  overflow: hidden;
}
.login-card-header {
  background: linear-gradient(180deg, #090d16 0%, #0f172a 100%) !important;
  color: #ffffff !important;
  border-bottom: 2px solid #059669;
}
.login-header-tabs {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 4px;
  color: #94a3b8;
}
.login-header-tabs .q-tab {
  border-radius: 8px;
  transition: all 0.2s ease;
  min-height: 42px;
}
.login-header-tabs .q-tab--active {
  color: #34d399 !important;
  background: rgba(16, 185, 129, 0.18);
  font-weight: 700;
}

/* Clases utilitarias de color y contraste */
.bg-slate-900 {
  background-color: #0f172a !important;
}
.bg-slate-800 {
  background-color: #1e293b !important;
}
.bg-slate-200 {
  background-color: #e2e8f0 !important;
}
.bg-slate-50 {
  background-color: #f8fafc !important;
}
.text-slate-900 {
  color: #0f172a !important;
}
.text-slate-800 {
  color: #1e293b !important;
}
.text-slate-700 {
  color: #334155 !important;
}
.text-slate-300 {
  color: #cbd5e1 !important;
}
.text-emerald-4, .text-emerald-400 {
  color: #34d399 !important;
}
.text-emerald-300 {
  color: #6ee7b7 !important;
}
.text-emerald-800 {
  color: #065f46 !important;
}
.text-emerald-9, .text-emerald-10 {
  color: #047857 !important;
}
.bg-emerald-100 {
  background-color: #d1fae5 !important;
}
.bg-emerald-1, .bg-emerald-50 {
  background-color: #ecfdf5 !important;
}
.border-emerald-8 {
  border: 1px solid #059669 !important;
}
.bg-amber-1 {
  background-color: #fffbeb !important;
}
.border-amber-8 {
  border: 1px solid #d97706 !important;
}
.text-amber-10 {
  color: #92400e !important;
}

/* Header Styles */
.bg-dark-header {
  background-color: #090d16 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.bg-dark-footer {
  background-color: #090d16 !important;
}
.border-t-subtle {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.brand-crest-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  overflow: hidden;
  background-color: #059669;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}
.brand-crest-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.brand-title {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #ffffff;
  line-height: 1.1;
}
.live-pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #10b981;
  display: inline-block;
  box-shadow: 0 0 6px #10b981;
}
.header-tabs .q-tab {
  padding: 0 14px;
  min-height: 48px;
  font-size: 0.86rem;
  font-weight: 600;
}
.header-tabs .q-tab__icon {
  margin-right: 6px;
}
.role-dropdown-btn {
  font-size: 0.78rem;
  font-weight: 700;
  border-radius: 6px;
}
</style>
