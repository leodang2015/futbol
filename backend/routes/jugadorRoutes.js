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

// Rutas de Autorización de Fichaje de Jugador (por el Entrenador o el Organizador)
router.put('/:id/autorizar', async (req, res) => {
  try {
    const Jugador = (await import('../models/Jugador.js')).default;
    const jug = await Jugador.findByIdAndUpdate(req.params.id, { estadoAprobacion: 'Aprobado' }, { new: true }).populate('equipo');
    if (!jug) return res.status(404).json({ msg: 'Jugador no encontrado' });
    res.json({ msg: `¡Futbolista ${jug.nombre} autorizado e incorporado al club!`, jugador: jug });
  } catch (err) {
    res.status(400).json({ msg: err.message || 'Error al autorizar jugador' });
  }
});

router.put('/:id/rechazar', async (req, res) => {
  try {
    const Jugador = (await import('../models/Jugador.js')).default;
    const jug = await Jugador.findByIdAndUpdate(req.params.id, { estadoAprobacion: 'Rechazado' }, { new: true }).populate('equipo');
    if (!jug) return res.status(404).json({ msg: 'Jugador no encontrado' });
    res.json({ msg: `Solicitud de fichaje de ${jug.nombre} rechazada.`, jugador: jug });
  } catch (err) {
    res.status(400).json({ msg: err.message || 'Error al rechazar jugador' });
  }
});

export default router;
