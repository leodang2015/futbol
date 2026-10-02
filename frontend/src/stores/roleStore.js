import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const ROLES = {
  ORGANIZADOR: 'organizador',
  ENTRENADOR: 'entrenador',
  INSCRIPCION: 'inscripcion'
}

export const useRoleStore = defineStore('roles', () => {
  // Guardamos el rol en localStorage para persistencia
  const rolActual = ref(localStorage.getItem('futbolito_rol') || ROLES.ORGANIZADOR)
  const equipoEntrenadorId = ref(localStorage.getItem('futbolito_dt_equipo') || '')

  const esOrganizador = computed(() => rolActual.value === ROLES.ORGANIZADOR)
  const esEntrenador = computed(() => rolActual.value === ROLES.ENTRENADOR)
  const esInscripcion = computed(() => rolActual.value === ROLES.INSCRIPCION)

  const rolInfo = computed(() => {
    switch (rolActual.value) {
      case ROLES.ORGANIZADOR:
        return {
          id: ROLES.ORGANIZADOR,
          nombre: 'Organizador',
          badge: '👑 Organizador',
          color: 'amber-9',
          bgClass: 'bg-amber-1',
          textColor: 'text-amber-10',
          descripcion: 'Control del fixture, programación de partidos y registro de resultados oficiales.'
        }
      case ROLES.ENTRENADOR:
        return {
          id: ROLES.ENTRENADOR,
          nombre: 'Entrenador (DT)',
          badge: '📋 Entrenador (DT)',
          color: 'emerald-7',
          bgClass: 'bg-emerald-1',
          textColor: 'text-emerald-10',
          descripcion: 'Gestión táctica del plantel, asignación de posiciones y convocatoria de jugadores.'
        }
      case ROLES.INSCRIPCION:
        return {
          id: ROLES.INSCRIPCION,
          nombre: 'Inscripción de Club',
          badge: '📝 Inscripciones',
          color: 'indigo-7',
          bgClass: 'bg-indigo-1',
          textColor: 'text-indigo-10',
          descripcion: 'Inscripción de nuevos clubes al campeonato y registro de delegados.'
        }
      default:
        return {
          id: ROLES.ORGANIZADOR,
          nombre: 'Organizador',
          badge: '👑 Organizador',
          color: 'amber-9',
          bgClass: 'bg-amber-1',
          textColor: 'text-amber-10',
          descripcion: 'Control general del torneo'
        }
    }
  })

  function cambiarRol (nuevoRol) {
    rolActual.value = nuevoRol
    localStorage.setItem('futbolito_rol', nuevoRol)
  }

  function setEquipoEntrenador (equipoId) {
    equipoEntrenadorId.value = equipoId
    localStorage.setItem('futbolito_dt_equipo', equipoId)
  }

  return {
    rolActual,
    equipoEntrenadorId,
    esOrganizador,
    esEntrenador,
    esInscripcion,
    rolInfo,
    cambiarRol,
    setEquipoEntrenador
  }
})
