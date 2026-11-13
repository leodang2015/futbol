import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Jugador from '../models/Jugador.js';

import { 
  crearJugador, 
  listarJugadores, 
  editarJugador, 
  eliminarJugador, 
  loginJugador 
} from '../controllers/jugadorController.js';
import { 
  crearJugadorValidator, 
  loginJugadorValidator, 
  actualizarJugadorValidator, 
  idValidator 
} from '../validators/jugadorValidator.js';

const router = Router();

// Middleware para validar el WebToken
const validarJWT = async (req, res, next) => {
  const token = req.header("x-token");

  if (!token) {
    return res.status(401).json({ msg: "No hay token en la petición" });
  }

  try {
    const { uid } = jwt.verify(token, process.env.SECRETORPRIVATEKEY || 'TuClaveSecretaSuperSegura123!@#');
    const jugador = await Jugador.findById(uid);

    if (!jugador) {
      return res.status(401).json({ msg: "Token no válido - el jugador no existe en DB" });
    }

    if (jugador.estado === 0) {
      return res.status(401).json({ msg: "Token no válido - jugador inactivo" });
    }

    req.jugador = jugador;
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Token no válido" });
  }
};

// --- RUTA PÚBLICA ---
router.post('/login', loginJugadorValidator, loginJugador);

// --- RUTAS DE JUGADORES ---
router.get('/', listarJugadores);
router.post('/', crearJugadorValidator, crearJugador);
router.put('/:id', [idValidator, actualizarJugadorValidator], editarJugador);
router.delete('/:id', idValidator, eliminarJugador);

export default router;
