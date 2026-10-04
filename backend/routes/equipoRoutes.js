import { Router } from 'express';
import { 
  crearEquipo, 
  listarEquipos, 
  editarEquipo, 
  eliminarEquipo,
  completarPlantel
} from '../controllers/equipoController.js';

const router = Router();

router.get('/', listarEquipos);
router.post('/', crearEquipo);
router.post('/:id/completar-plantel', completarPlantel);
router.put('/:id', editarEquipo);
router.delete('/:id', eliminarEquipo);

export default router;
