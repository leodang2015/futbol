import { Router } from 'express'
import Notificacion from '../models/Notificacion.js'

const router = Router()

// Listar todas las notificaciones (para el Administrador)
router.get('/', async (req, res) => {
  try {
    const notificaciones = await Notificacion.find()
      .sort({ createdAt: -1 })
      .populate('equipo partido')
    res.json(notificaciones)
  } catch (error) {
    console.error('Error al obtener notificaciones:', error)
    res.status(500).json({ msg: 'Error al listar notificaciones' })
  }
})

// Crear notificación (enviada por el DT)
router.post('/', async (req, res) => {
  try {
    const { tipo, titulo, mensaje, remitente, equipo, equipoNombre, partido, datos } = req.body

    if (!titulo || !mensaje) {
      return res.status(400).json({ msg: 'El título y el mensaje son obligatorios' })
    }

    const notificacion = new Notificacion({
      tipo: tipo || 'reporte_goleadores',
      titulo,
      mensaje,
      remitente: remitente || 'Entrenador (DT)',
      equipo: equipo || null,
      equipoNombre: equipoNombre || '',
      partido: partido || null,
      datos: datos || {},
      leida: false
    })

    await notificacion.save()
    res.status(201).json(notificacion)
  } catch (error) {
    console.error('Error al crear notificación:', error)
    res.status(400).json({ msg: 'Error al registrar notificación' })
  }
})

// Marcar todas como leídas
router.patch('/marcar-todas', async (req, res) => {
  try {
    await Notificacion.updateMany({ leida: false }, { leida: true })
    res.json({ msg: 'Todas las notificaciones fueron marcadas como leídas' })
  } catch (error) {
    console.error('Error al actualizar notificaciones:', error)
    res.status(500).json({ msg: 'Error al actualizar notificaciones' })
  }
})

// Marcar una como leída
router.patch('/:id/leida', async (req, res) => {
  try {
    const notificacion = await Notificacion.findByIdAndUpdate(
      req.params.id,
      { leida: true },
      { new: true }
    )
    if (!notificacion) {
      return res.status(404).json({ msg: 'Notificación no encontrada' })
    }
    res.json(notificacion)
  } catch (error) {
    console.error('Error al marcar notificación:', error)
    res.status(400).json({ msg: 'Error al actualizar notificación' })
  }
})

// Eliminar notificación
router.delete('/:id', async (req, res) => {
  try {
    const notificacion = await Notificacion.findByIdAndDelete(req.params.id)
    if (!notificacion) {
      return res.status(404).json({ msg: 'Notificación no encontrada' })
    }
    res.json({ msg: 'Notificación eliminada correctamente' })
  } catch (error) {
    console.error('Error al eliminar notificación:', error)
    res.status(400).json({ msg: 'Error al eliminar notificación' })
  }
})

export default router
