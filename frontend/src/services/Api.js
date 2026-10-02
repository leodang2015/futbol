import axios from 'axios'

// Cliente HTTP con Axios (Express + MongoDB, puerto 4000)
// En desarrollo, Vite redirige /api -> localhost:4000
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Función helper para procesar solicitudes y estandarizar errores
async function request(config) {
  try {
    const response = await apiClient(config)
    return response.data
  } catch (error) {
    let message = ''
    if (error.response?.data?.errores && Array.isArray(error.response.data.errores)) {
      message = error.response.data.errores.map(e => e.msg || e.message).join(', ')
    } else if (error.response?.data?.msg) {
      message = error.response.data.msg
    } else if (error.response?.data?.message) {
      message = error.response.data.message
    } else if (error.message) {
      message = error.message
    } else {
      message = 'Error de conexión con el servidor'
    }
    
    throw new Error(message)
  }
}

// Rutas esperadas en el backend
export default {
  getTorneo: () => request({ url: '/torneos', method: 'GET' }),
  getEquipos: () => request({ url: '/equipos', method: 'GET' }),
  getJugadores: () => request({ url: '/jugadores', method: 'GET' }),
  getPartidos: () => request({ url: '/partidos', method: 'GET' }),
  crearEquipo: (data) => request({ url: '/equipos', method: 'POST', data }),
  crearPartido: (data) => request({ url: '/partidos', method: 'POST', data }),
  crearJugador: (data) => request({ url: '/jugadores', method: 'POST', data }),
  actualizarJugador: (id, data) => request({ url: `/jugadores/${id}`, method: 'PUT', data }),
  crearTorneo: (data) => request({ url: '/torneos', method: 'POST', data })
}
