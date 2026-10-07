import { Router } from 'express'
import jwt from 'jsonwebtoken'
import Jugador from '../models/Jugador.js'
import { 
  listarPartidos, 
  cargarResultado, 
  obtenerTablaPosiciones,
  crearPartido,
  actualizarGoleadores
} from '../controllers/partidoController.js'

const router = Router()

// Middleware para validar el WebToken
const validarJWT = async (req, res, next) => {
  const token = req.header("x-token") || req.header("authorization")?.replace("Bearer ", "")

  if (!token) {
    return res.status(401).json({ msg: "No hay token en la petición" })
  }

  try {
    const { uid } = jwt.verify(token, process.env.SECRETORPRIVATEKEY || 'TuClaveSecretaSuperSegura123!@#')
    req.uid = uid
    next()
  } catch (error) {
    return res.status(401).json({ msg: "Token no válido" })
  }
}

// --- RUTAS DE PARTIDOS ---

// Consultas públicas
router.get('/', listarPartidos)
router.get('/posiciones/:torneoId', obtenerTablaPosiciones)
router.post('/', crearPartido)

// Actualizar goleadores y resultado (Reporte oficial de Entrenador u Organizador)
router.put('/:id/goleadores', actualizarGoleadores)
router.patch('/:id/goleadores', actualizarGoleadores)

// Operación protegida
router.patch('/:id/resultado', validarJWT, cargarResultado)

export default router
