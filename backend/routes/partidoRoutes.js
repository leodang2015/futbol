import { Router } from 'express'
import jwt from 'jsonwebtoken'
import Jugador from '../models/Jugador.js'
import { 
  listarPartidos, 
  cargarResultado, 
  obtenerTablaPosiciones,
  crearPartido
} from '../controllers/partidoController.js'

const router = Router()

// Middleware para validar el WebToken
const validarJWT = async (req, res, next) => {
  const token = req.header("x-token")

  if (!token) {
    return res.status(401).json({ msg: "No hay token en la petición" })
  }

  try {
    const { uid } = jwt.verify(token, process.env.SECRETORPRIVATEKEY || 'TuClaveSecretaSuperSegura123!@#')
    const jugador = await Jugador.findById(uid)

    if (!jugador) {
      return res.status(401).json({ msg: "Token no válido - el usuario no existe en DB" })
    }

    if (jugador.estado === 0) {
      return res.status(401).json({ msg: "Token no válido - usuario inactivo" })
    }

    req.jugador = jugador
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

// Operación protegida (requiere WebToken)
router.patch('/:id/resultado', validarJWT, cargarResultado)

export default router
