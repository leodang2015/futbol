<template>
  <q-layout view="hHh lpr fFf" class="app-layout">
    <!-- Navbar Oficial con 3 Zonas + Role Switcher -->
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

          <!-- Zona 2: Navegación Central con Roles -->
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
                label="Pizarra DT (Posiciones)"
                :class="{ 'text-positive text-weight-bold': roleStore.esEntrenador }"
              />
              <q-route-tab
                to="/inscripcion"
                :icon="matGroupAdd"
                label="Inscribirse"
                :class="{ 'text-indigo-3 text-weight-bold': roleStore.esInscripcion }"
              />
            </q-tabs>
          </div>

          <!-- Zona 3: Selector de Rol y Acciones -->
          <div class="row items-center q-gutter-xs no-wrap">
            <!-- Selector de Rol Interactivo -->
            <q-btn-dropdown
              unelevated
              dense
              no-caps
              class="role-dropdown-btn q-px-sm"
              :class="roleColorClass"
              :label="roleStore.rolInfo.badge"
            >
              <q-list style="min-width: 270px" class="q-py-xs">
                <q-item-label header class="text-caption text-weight-bolder text-grey-7">
                  SELECCIONAR ROL EN FRONTEND
                </q-item-label>

                <!-- Rol 1: Organizador -->
                <q-item
                  clickable
                  v-close-popup
                  :active="roleStore.esOrganizador"
                  active-class="bg-amber-1 text-amber-10"
                  @click="cambiarRol(ROLES.ORGANIZADOR)"
                >
                  <q-item-section avatar style="min-width: 36px">
                    <span class="text-h6">👑</span>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-bold">Organizador</q-item-label>
                    <q-item-label caption class="text-grey-6">Hacer partidos, fixture y resultados</q-item-label>
                  </q-item-section>
                </q-item>

                <!-- Rol 2: Entrenador (DT) -->
                <q-item
                  clickable
                  v-close-popup
                  :active="roleStore.esEntrenador"
                  active-class="bg-emerald-1 text-emerald-10"
                  @click="cambiarRol(ROLES.ENTRENADOR)"
                >
                  <q-item-section avatar style="min-width: 36px">
                    <span class="text-h6">📋</span>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-bold">Entrenador (DT)</q-item-label>
                    <q-item-label caption class="text-grey-6">Elegir posiciones tácticas del equipo</q-item-label>
                  </q-item-section>
                </q-item>

                <!-- Rol 3: Inscripción -->
                <q-item
                  clickable
                  v-close-popup
                  :active="roleStore.esInscripcion"
                  active-class="bg-indigo-1 text-indigo-10"
                  @click="cambiarRol(ROLES.INSCRIPCION)"
                >
                  <q-item-section avatar style="min-width: 36px">
                    <span class="text-h6">📝</span>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-bold">Inscribirse</q-item-label>
                    <q-item-label caption class="text-grey-6">Inscribir nuevo club al torneo</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>

            <!-- Botón Principal Adaptado al Rol -->
            <template v-if="roleStore.esOrganizador">
              <q-btn
                unelevated
                dense
                no-caps
                color="primary"
                class="btn-nav q-px-sm"
                :icon="matSportsScore"
                label="Registrar Partido"
                :disable="store.equipos.length < 2"
                @click="dialogoPartido = true"
              >
                <q-tooltip v-if="store.equipos.length < 2">
                  Se requieren al menos 2 clubes registrados
                </q-tooltip>
              </q-btn>
            </template>

            <template v-else-if="roleStore.esEntrenador">
              <q-btn
                unelevated
                dense
                no-caps
                color="positive"
                class="btn-nav q-px-sm"
                :icon="matSports"
                label="Pizarra Táctica"
                to="/entrenador"
              />
            </template>

            <template v-else>
              <q-btn
                unelevated
                dense
                no-caps
                color="indigo"
                class="btn-nav q-px-sm"
                :icon="matGroupAdd"
                label="Inscribir Club"
                to="/inscripcion"
              />
            </template>

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
              <q-tooltip>Sincronizar con MongoDB Atlas</q-tooltip>
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
            <q-route-tab to="/inscripcion" :icon="matGroupAdd" label="Inscripción" />
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

        <!-- Barra de Contexto de Rol Activo -->
        <div class="role-context-bar rounded-borders q-pa-sm q-mb-md row items-center justify-between" :class="roleStore.rolInfo.bgClass">
          <div class="row items-center q-gutter-sm">
            <span class="text-subtitle1">{{ roleStore.rolInfo.badge }}</span>
            <div class="text-caption text-weight-medium" :class="roleStore.rolInfo.textColor">
              {{ roleStore.rolInfo.descripcion }}
            </div>
          </div>

          <div class="row items-center q-gutter-xs">
            <q-btn
              v-if="roleStore.esOrganizador"
              unelevated
              dense
              no-caps
              size="sm"
              color="amber-9"
              text-color="white"
              :icon="matSportsScore"
              label="+ Nuevo Partido"
              @click="dialogoPartido = true"
              class="q-px-sm text-weight-bold"
            />
            <q-btn
              v-else-if="roleStore.esEntrenador"
              unelevated
              dense
              no-caps
              size="sm"
              color="positive"
              text-color="white"
              :icon="matSports"
              label="Elegir Posiciones de Jugadores"
              to="/entrenador"
              class="q-px-sm text-weight-bold"
            />
            <q-btn
              v-else
              unelevated
              dense
              no-caps
              size="sm"
              color="indigo"
              text-color="white"
              :icon="matGroupAdd"
              label="Formulario de Inscripción"
              to="/inscripcion"
              class="q-px-sm text-weight-bold"
            />
          </div>
        </div>

        <!-- Hero Header del Torneo con diseño deportivo moderno -->
        <div class="tournament-hero-card rounded-borders q-mb-lg overflow-hidden">
          <div class="hero-content-wrap q-pa-lg row items-center justify-between">
            <div class="col-12 col-md-8">
              <div class="hero-kicker text-uppercase text-weight-bold text-emerald-400 q-mb-xs">
                Torneo Barrial Oficial
              </div>
              <h1 class="hero-heading text-weight-bolder text-white q-my-none">
                {{ store.torneo?.nombre || 'Liga de Fútbol Barrial' }}
              </h1>
              <p class="hero-subtext text-grey-3 q-mt-xs q-mb-none">
                {{ store.torneo?.descripcion || 'Resultados oficiales, tabla de posiciones y fixture en tiempo real desde MongoDB Atlas.' }}
              </p>
            </div>

            <div class="col-12 col-md-4 text-left text-md-right q-mt-md q-mt-md-none">
              <div class="atlas-badge inline-flex items-center">
                <span class="atlas-dot q-mr-xs" />
                <span class="text-caption text-white font-mono">Cluster Atlas Sincronizado</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Fila de Estadísticas Oficiales con SVG icons -->
        <div class="row q-col-gutter-md q-mb-lg">
          <div v-for="s in metricas" :key="s.label" class="col-6 col-md-3">
            <q-card flat bordered class="metric-card bg-white rounded-borders">
              <q-card-section class="q-pa-md">
                <div class="row items-center justify-between no-wrap q-mb-xs">
                  <span class="metric-label text-caption text-grey-7 text-weight-medium">{{ s.label }}</span>
                  <div class="metric-icon-box" :class="s.bgClass">
                    <q-icon :name="s.icon" size="18px" :class="s.iconClass" />
                  </div>
                </div>
                <div class="metric-value font-mono text-h4 text-weight-bold text-dark q-mt-xs">
                  {{ s.value }}
                </div>
                <div class="metric-sub text-caption text-grey-6 q-mt-xs">
                  {{ s.sub }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Estado vacío cuando no hay equipos -->
        <div
          v-if="!store.cargando && store.equipos.length === 0"
          class="empty-onboarding-card bg-white q-pa-xl rounded-borders text-center q-mb-lg"
        >
          <div class="empty-icon-wrap q-mx-auto q-mb-md">
            <q-icon :name="matSportsSoccer" size="36px" color="primary" />
          </div>
          <div class="text-h6 text-weight-bold text-dark q-mb-xs">Tu Liga Barrial está Lista para Comenzar</div>
          <p class="text-grey-7 text-body2 max-w-lg q-mx-auto q-mb-lg">
            Actualmente no hay clubes registrados en tu base de datos de MongoDB Atlas. Inscribe tu primer equipo para habilitar la tabla de posiciones, planteles y fixture.
          </p>
          <div>
            <q-btn
              color="primary"
              unelevated
              no-caps
              :icon="matGroupAdd"
              label="Inscribir Primer Club"
              class="q-px-lg text-weight-bold"
              to="/inscripcion"
            />
          </div>
        </div>

        <!-- Indicador de Carga -->
        <q-inner-loading :showing="store.cargando" color="primary" label="Cargando datos de Atlas..." />

        <!-- Router View con las vistas oficiales -->
        <router-view />
      </q-page>
    </q-page-container>

    <!-- Footer Discreto y Profesional -->
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

    <!-- Diálogos Globales -->
    <PartidoDialog v-model="dialogoPartido" />
    <EquipoDialog v-model="dialogoEquipo" />
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTorneoStore } from './stores/torneoStore.js'
import { useRoleStore, ROLES } from './stores/roleStore.js'
import PartidoDialog from './components/PartidoDialog.vue'
import EquipoDialog from './components/EquipoDialog.vue'

// Import Quasar Pure SVG Icons (Immune to missing webfonts & ligature glitches)
import {
  matSportsSoccer,
  matTableChart,
  matCalendarMonth,
  matShield,
  matMilitaryTech,
  matGroupAdd,
  matSportsScore,
  matRefresh,
  matGroups,
  matSpeed,
  matEvent,
  matSports
} from '@quasar/extras/material-icons'

const store = useTorneoStore()
const roleStore = useRoleStore()
const router = useRouter()

const dialogoPartido = ref(false)
const dialogoEquipo = ref(false)

const roleColorClass = computed(() => {
  if (roleStore.esOrganizador) return 'bg-amber-6 text-slate-900 font-bold'
  if (roleStore.esEntrenador) return 'bg-emerald-6 text-white font-bold'
  return 'bg-indigo-6 text-white font-bold'
})

function cambiarRol(rol) {
  roleStore.cambiarRol(rol)
  if (rol === ROLES.ENTRENADOR) {
    router.push('/entrenador')
  } else if (rol === ROLES.INSCRIPCION) {
    router.push('/inscripcion')
  }
}

onMounted(() => {
  store.cargarTodo()
})

const metricas = computed(() => [
  {
    label: 'Clubes Inscriptos',
    value: store.equipos.length,
    sub: store.equipos.length === 0 ? 'Sin registros' : `${store.equipos.length} participantes`,
    icon: matGroups,
    bgClass: 'bg-emerald-50',
    iconClass: 'text-emerald-700'
  },
  {
    label: 'Partidos Jugados',
    value: store.stats.partidos,
    sub: `${store.stats.goles} goles anotados`,
    icon: matSportsSoccer,
    bgClass: 'bg-blue-50',
    iconClass: 'text-blue-700'
  },
  {
    label: 'Promedio de Gol',
    value: store.stats.promedio,
    sub: 'Goles por encuentro',
    icon: matSpeed,
    bgClass: 'bg-amber-50',
    iconClass: 'text-amber-700'
  },
  {
    label: 'Próxima Jornada',
    value: store.stats.proxima ? `Fecha ${store.stats.proxima}` : '—',
    sub: store.stats.proxima ? 'Próximos cruces' : 'Sin pendientes',
    icon: matEvent,
    bgClass: 'bg-purple-50',
    iconClass: 'text-purple-700'
  }
])
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
  width: 36px;
  height: 36px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #059669;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
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
.btn-nav {
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 6px;
}
.role-dropdown-btn {
  font-size: 0.78rem;
  font-weight: 700;
  border-radius: 6px;
}

/* Role Context Bar */
.role-context-bar {
  border: 1px solid rgba(0, 0, 0, 0.06);
}

/* Hero Banner Card */
.tournament-hero-card {
  background: linear-gradient(135deg, #090d16 0%, #0f1f2e 50%, #064e3b 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
.hero-content-wrap {
  min-height: 120px;
}
.hero-kicker {
  letter-spacing: 0.08em;
  font-size: 0.72rem;
  color: #34d399;
}
.hero-heading {
  font-size: 1.65rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
}
.hero-subtext {
  font-size: 0.88rem;
  max-width: 640px;
}
.atlas-badge {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 20px;
  padding: 6px 14px;
}
.atlas-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #10b981;
  display: inline-block;
}

/* Metric Cards */
.metric-card {
  border: 1px solid #e2e8f0;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
}
.metric-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bg-emerald-50 {
  background-color: #ecfdf5;
}
.text-emerald-700 {
  color: #047857;
}
.bg-blue-50 {
  background-color: #eff6ff;
}
.text-blue-700 {
  color: #1d4ed8;
}
.bg-amber-50 {
  background-color: #fffbeb;
}
.text-amber-700 {
  color: #b45309;
}
.bg-purple-50 {
  background-color: #faf5ff;
}
.text-purple-700 {
  color: #7e22ce;
}
.metric-value {
  line-height: 1.1;
}

/* Empty State Card */
.empty-onboarding-card {
  border: 1px dashed #cbd5e1;
  background-color: #ffffff;
}
.empty-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #ecfdf5;
  display: flex;
  align-items: center;
  justify-content: center;
}
.max-w-lg {
  max-width: 32rem;
}
</style>
