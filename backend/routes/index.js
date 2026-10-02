import { Router } from 'express';
import equipoRoutes from './equipoRoutes.js';
import jugadorRoutes from './jugadorRoutes.js';
import partidoRoutes from './partidoRoutes.js';
import torneoRoutes from './torneoRoutes.js';

const router = Router();

router.use('/equipos', equipoRoutes);
router.use('/jugadores', jugadorRoutes);
router.use('/partidos', partidoRoutes);
router.use('/torneos', torneoRoutes);

export default router;
