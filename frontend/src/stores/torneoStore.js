import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/Api.js'

// Acepta el id suelto o un objeto poblado de Mongo ({ _id, ... })
const idDe = (v) => (v && typeof v === 'object' ? (v._id ?? v.id) : v)
const lista = (d) => (Array.isArray(d) ? d : d?.data ?? d?.equipos ?? d?.jugadores ?? d?.partidos ?? [])

export const useTorneoStore = defineStore('torneo', () => {
  // Todo viene del backend: nada se escribe a mano aquí
  const torneo = ref(null)
  const equipos = ref([])
  const jugadores = ref([])
  const partidos = ref([])
  const cargando = ref(false)
  const error = ref('')

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

  async function cargarTodo () {
    cargando.value = true
    error.value = ''
    try {
      const [t, e, j, p] = await Promise.all([
        api.getTorneo().catch(() => null), api.getEquipos(), api.getJugadores(), api.getPartidos()
      ])
      torneo.value = Array.isArray(t) ? t[0] : (t?.torneo ?? t)
      equipos.value = lista(e).map(normEquipo)
      jugadores.value = lista(j).map(normJugador)
      partidos.value = lista(p).map(normPartido)
    } catch (err) {
      error.value = err.message
    } finally {
      cargando.value = false
    }
  }

  async function agregarEquipo (datos) {
    await api.crearEquipo(datos)
    await cargarTodo()
  }

  async function agregarJugador (datos) {
    await api.crearJugador(datos)
    await cargarTodo()
  }

  async function actualizarPosicionJugador (id, nuevaPosicion) {
    await api.actualizarJugador(id, { posicion: nuevaPosicion })
    await cargarTodo()
  }

  async function actualizarJugador (id, datos) {
    await api.actualizarJugador(id, datos)
    await cargarTodo()
  }

  async function crearTorneo (datos) {
    await api.crearTorneo(datos)
    await cargarTodo()
  }

  async function guardarPartido (datos) {
    await api.crearPartido({ ...datos, estado: 'jugado' })
    await cargarTodo()
  }

  const jugados = computed(() => partidos.value.filter(p => ['jugado', 'finalizado'].includes(p.estado)))

  // Tabla calculada a partir de los partidos que entrega el backend
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

  return {
    torneo, equipos, jugadores, partidos, cargando, error, tabla, stats, fechas,
    goleadores, asistidores, equipoPorId, cargarTodo, agregarEquipo, guardarPartido,
    agregarJugador, actualizarPosicionJugador, actualizarJugador, crearTorneo
  }
})
