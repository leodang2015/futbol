import { Router } from 'express'
import { registro, login, perfil, codigosInfo } from '../controllers/authController.js'

const router = Router()

router.post('/registro', registro)
router.post('/login', login)
router.get('/perfil', perfil)
router.get('/roles-codigos', codigosInfo)

export default router
