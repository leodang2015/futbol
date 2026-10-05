import { ref, computed, reactive } from 'vue'
import axios from 'axios'

// Configuración de Axios directo a la API de Express
const API_URL = import.meta.env.VITE_API_URL || '/api'

export const ROLES = {
  ORGANIZADOR: 'organizador',
  ENTRENADOR: 'entrenador',
  JUGADOR: 'jugador',
  INSCRIPCION: 'jugador'
}

export const CODIGOS_ROL = {
  organizador: '1',
  entrenador: '2',
  jugador: '3'
}

// Helpers
const idDe = (v) => (v && typeof v === 'object' ? (v._id ?? v.id) : v)
const lista = (d) => (Array.isArray(d) ? d : d?.data ?? d?.equipos ?? d?.jugadores ?? d?.partidos ?? [])

// Estado reactivo global sin usar Pinia ni librerías externas
const torneo = ref(null)
const equipos = ref([])
const jugadores = ref([])
const partidos = ref([])
const cargando = ref(false)
const error = ref('')

// Estado de usuario y autenticación
const usuarioGuardado = (() => {
  try {
    return JSON.parse(localStorage.getItem('futbolito_user') || 'null')
  } catch {
    return null
  }
})()

const user = ref(usuarioGuardado)
const token = ref(localStorage.getItem('futbolito_auth_token') || '')
const rolActual = ref(localStorage.getItem('futbolito_rol') || (usuarioGuardado?.rol || ROLES.ORGANIZADOR))
const equipoEntrenadorId = ref(localStorage.getItem('futbolito_dt_equipo') || '')

// Diálogos globales
const dialogoPartido = ref(false)
const dialogoEquipo = ref(false)
const mostrarAuthModal = ref(false)
const errorAuth = ref('')

// Helper para headers con token
function authHeaders() {
  return token.value ? { Authorization: `Bearer ${token.value}` } : {}
}

// Normalizadores
const normEquipo = (e) => ({ ...e, id: idDe(e) })
const normJugador = (j) => ({ ...j, id: idDe(j), equipoId: idDe(j.equipoId ?? j.equipo) })
const normPartido = (p) => ({
  ...p,
  id: idDe(p),
  fecha: p.fecha ?? p.jornada ?? 1,
  estado: (p.estado || '').toLowerCase(),
  localId: idDe(p.localId ?? p.local),
  visitanteId: idDe(p.visitanteId ?? p.visitante),
  golesLocal: p.golesLocal ?? p.goles_local ?? 0,
  golesVisitante: p.golesVisitante ?? p.goles_visitante ?? 0
})

// Carga de datos de la API
async function cargarTodo() {
  cargando.value = true
  error.value = ''
  try {
    const [tRes, eRes, jRes, pRes] = await Promise.all([
      axios.get(`${API_URL}/torneos`).catch(() => ({ data: [] })),
      axios.get(`${API_URL}/equipos`).catch(() => ({ data: [] })),
      axios.get(`${API_URL}/jugadores`).catch(() => ({ data: [] })),
      axios.get(`${API_URL}/partidos`).catch(() => ({ data: [] }))
    ])

    const tData = tRes.data
    torneo.value = Array.isArray(tData) ? tData[0] : (tData?.torneo ?? tData)
    equipos.value = lista(eRes.data).map(normEquipo)
    jugadores.value = lista(jRes.data).map(normJugador)
    partidos.value = lista(pRes.data).map(normPartido)
  } catch (err) {
    error.value = err.response?.data?.msg || err.message || 'Error de conexión'
  } finally {
    cargando.value = false
  }
}

// Métodos de Torneo y Equipos
async function agregarEquipo(datos) {
  await axios.post(`${API_URL}/equipos`, datos, { headers: authHeaders() })
  await cargarTodo()
}

async function agregarJugador(datos) {
  await axios.post(`${API_URL}/jugadores`, datos, { headers: authHeaders() })
  await cargarTodo()
}

async function actualizarPosicionJugador(id, nuevaPosicion) {
  await axios.put(`${API_URL}/jugadores/${id}`, { posicion: nuevaPosicion }, { headers: authHeaders() })
  await cargarTodo()
}

async function actualizarJugador(id, datos) {
  await axios.put(`${API_URL}/jugadores/${id}`, datos, { headers: authHeaders() })
  await cargarTodo()
}

async function crearTorneo(datos) {
  await axios.post(`${API_URL}/torneos`, datos, { headers: authHeaders() })
  await cargarTodo()
}

async function guardarPartido(datos) {
  try {
    const res = await axios.post(`${API_URL}/partidos`, { ...datos, estado: 'jugado' }, { headers: authHeaders() })
    await cargarTodo()
    return res.data
  } catch (err) {
    const msg = err.response?.data?.msg || err.message || 'Error al registrar el partido'
    throw new Error(msg)
  }
}

async function completarPlantelEquipo(equipoId) {
  const eqId = idDe(equipoId)
  try {
    const res = await axios.post(`${API_URL}/equipos/${eqId}/completar-plantel`, {}, { headers: authHeaders() })
    await cargarTodo()
    return res.data
  } catch (err) {
    const msg = err.response?.data?.msg || err.message || 'Error al completar el plantel'
    throw new Error(msg)
  }
}

// Métodos de Autenticación
async function login(credenciales) {
  cargando.value = true
  errorAuth.value = ''
  try {
    const res = await axios.post(`${API_URL}/auth/login`, credenciales)
    const data = res.data
    user.value = data.usuario
    token.value = data.token
    rolActual.value = data.usuario.rol || ROLES.ORGANIZADOR

    localStorage.setItem('futbolito_auth_token', data.token)
    localStorage.setItem('futbolito_user', JSON.stringify(data.usuario))
    localStorage.setItem('futbolito_rol', rolActual.value)
    if (data.usuario.equipo) {
      localStorage.setItem('futbolito_dt_equipo', data.usuario.equipo)
    }

    await cargarTodo()
    return data
  } catch (err) {
    const msg = err.response?.data?.msg || 'Error al iniciar sesión'
    errorAuth.value = msg
    throw new Error(msg)
  } finally {
    cargando.value = false
  }
}

async function registro(datos) {
  cargando.value = true
  errorAuth.value = ''
  try {
    const res = await axios.post(`${API_URL}/auth/registro`, datos)
    const data = res.data
    user.value = data.usuario
    token.value = data.token
    rolActual.value = data.usuario.rol || ROLES.ORGANIZADOR

    localStorage.setItem('futbolito_auth_token', data.token)
    localStorage.setItem('futbolito_user', JSON.stringify(data.usuario))
    localStorage.setItem('futbolito_rol', rolActual.value)
    if (data.usuario.equipo) {
      localStorage.setItem('futbolito_dt_equipo', data.usuario.equipo)
    }

    await cargarTodo()
    return data
  } catch (err) {
    const msg = err.response?.data?.msg || 'Error al registrar usuario'
    errorAuth.value = msg
    throw new Error(msg)
  } finally {
    cargando.value = false
  }
}

function logout() {
  user.value = null
  token.value = ''
  rolActual.value = ROLES.ORGANIZADOR
  localStorage.removeItem('futbolito_auth_token')
  localStorage.removeItem('futbolito_user')
  localStorage.removeItem('futbolito_rol')
  localStorage.removeItem('futbolito_dt_equipo')
}

function cambiarRol(nuevoRol) {
  rolActual.value = nuevoRol
  localStorage.setItem('futbolito_rol', nuevoRol)
}

function setEquipoEntrenador(equipoId) {
  equipoEntrenadorId.value = equipoId
  localStorage.setItem('futbolito_dt_equipo', equipoId)
}

function abrirDialogoPartido() {
  dialogoPartido.value = true
}

function abrirDialogoEquipo() {
  dialogoEquipo.value = true
}

function abrirLogin() {
  mostrarAuthModal.value = true
}

function abrirRegistro(rolSugerido) {
  if (rolSugerido) {
    cambiarRol(rolSugerido)
  }
  mostrarAuthModal.value = true
}

function cerrarModal() {
  mostrarAuthModal.value = false
  errorAuth.value = ''
}

// Propiedades computadas
const isAuthenticated = computed(() => !!user.value && !!token.value)
const esOrganizador = computed(() => rolActual.value === ROLES.ORGANIZADOR)
const esEntrenador = computed(() => rolActual.value === ROLES.ENTRENADOR)
const esJugador = computed(() => rolActual.value === ROLES.JUGADOR || rolActual.value === 'inscripcion')
const esInscripcion = computed(() => rolActual.value === ROLES.JUGADOR || rolActual.value === 'inscripcion')

const nombreDisplay = computed(() => {
  if (!user.value) return 'Invitado'
  const name = user.value.nombre || user.value.usuario
  return (name && typeof name === 'string') ? name : 'Usuario'
})

const rolInfo = computed(() => {
  switch (rolActual.value) {
    case ROLES.ORGANIZADOR:
      return {
        id: ROLES.ORGANIZADOR,
        codigo: '1',
        nombre: 'Organizador',
        badge: '👑 Organizador',
        color: 'amber-9',
        bgClass: 'bg-amber-1',
        textColor: 'text-amber-10',
        descripcion: 'Control total de torneos, fixtures, programación de partidos y actas oficiales.'
      }
    case ROLES.ENTRENADOR:
      return {
        id: ROLES.ENTRENADOR,
        codigo: '2',
        nombre: 'Entrenador (DT)',
        badge: '📋 Entrenador',
        color: 'emerald-7',
        bgClass: 'bg-emerald-1',
        textColor: 'text-emerald-10',
        descripcion: 'Gestión táctica del plantel, formaciones, posiciones en cancha y dorsales.'
      }
    case ROLES.JUGADOR:
    case 'inscripcion':
    default:
      return {
        id: ROLES.JUGADOR,
        codigo: '3',
        nombre: 'Jugador',
        badge: '⚽ Jugador',
        color: 'indigo-7',
        bgClass: 'bg-indigo-1',
        textColor: 'text-indigo-10',
        descripcion: 'Consulta de nómina, posición táctica en el club, fixture y estadísticas.'
      }
  }
})

const jugados = computed(() => partidos.value.filter(p => ['jugado', 'finalizado'].includes(p.estado)))

const tabla = computed(() => {
  const t = equipos.value.map(e => ({ ...e, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0, racha: [] }))
  jugados.value.forEach(p => {
    const l = t.find(e => e.id === p.localId)
    const v = t.find(e => e.id === p.visitanteId)
    if (!l || !v) return
    l.pj++; v.pj++
    l.gf += p.golesLocal; l.gc += p.golesVisitante
    v.gf += p.golesVisitante; v.gc += p.golesLocal
    if (p.golesLocal > p.golesVisitante) { l.pg++; l.pts += 3; l.racha.push('V'); v.pp++; v.racha.push('D') }
    else if (p.golesLocal < p.golesVisitante) { v.pg++; v.pts += 3; v.racha.push('V'); l.pp++; l.racha.push('D') }
    else { l.pe++; v.pe++; l.pts++; v.pts++; l.racha.push('E'); v.racha.push('E') }
  })
  t.forEach(e => { e.dg = e.gf - e.gc })
  return t.sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf)
})

const stats = computed(() => {
  const goles = jugados.value.reduce((s, p) => s + p.golesLocal + p.golesVisitante, 0)
  const pendientes = partidos.value.filter(p => !['jugado', 'finalizado'].includes(p.estado))
  const proxima = pendientes.length ? Math.min(...pendientes.map(p => p.fecha)) : null
  return {
    partidos: jugados.value.length,
    goles,
    promedio: jugados.value.length ? (goles / jugados.value.length).toFixed(2) : '0.00',
    equipos: equipos.value.length,
    proxima
  }
})

const fechas = computed(() => [...new Set(partidos.value.map(p => p.fecha))].sort((a, b) => a - b))
const topPor = (campo) => [...jugadores.value].sort((a, b) => (b[campo] ?? 0) - (a[campo] ?? 0)).slice(0, 5)
const goleadores = computed(() => topPor('goles'))
const asistidores = computed(() => topPor('asistencias'))
const equipoPorId = (id) => equipos.value.find(e => e.id === id)

const cantidadJugadoresEquipo = (equipoId) => {
  const eqId = idDe(equipoId)
  if (!eqId) return 0
  return jugadores.value.filter(j => idDe(j.equipoId ?? j.equipo) === eqId).length
}

const equipoHabilitadoParaJugar = (equipoId) => cantidadJugadoresEquipo(equipoId) >= 11

// Objeto de estado único compartido y reactivo
const state = reactive({
  // Datos
  torneo, equipos, jugadores, partidos, cargando, error, tabla, stats, fechas,
  goleadores, asistidores, equipoPorId, cantidadJugadoresEquipo, equipoHabilitadoParaJugar,
  // Acciones torneo
  cargarTodo, agregarEquipo, agregarJugador, actualizarPosicionJugador, actualizarJugador,
  crearTorneo, guardarPartido, completarPlantelEquipo,
  // Diálogos
  dialogoPartido, dialogoEquipo, abrirDialogoPartido, abrirDialogoEquipo,
  // Auth y Roles
  user, token, rolActual, equipoEntrenadorId, isAuthenticated,
  esOrganizador, esEntrenador, esJugador, esInscripcion, nombreDisplay, rolInfo,
  mostrarAuthModal, errorAuth,
  login, registro, logout, cambiarRol, setEquipoEntrenador, abrirLogin, abrirRegistro, cerrarModal
})

export function useTorneo() { return state }
export function useTorneoStore() { return state }
export function useRoleStore() { return state }
export function useAuthStore() { return state }

export default state
