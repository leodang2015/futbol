import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'

import equipoRoutes from './routes/equipoRoutes.js'
import jugadorRoutes from './routes/jugadorRoutes.js'
import torneoRoutes from './routes/torneoRoutes.js'
import partidoRoutes from './routes/partidoRoutes.js'
import authRoutes from './routes/authRoutes.js'
import notificacionRoutes from './routes/notificacionRoutes.js'
export default app
dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI

let isConnected = false
async function connectDB() {
  if (mongoose.connection.readyState >= 1) return
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    })
    console.log('Conectado a MongoDB Atlas exitosamente')
  } catch (err) {
    console.warn('Aviso de conexión a MongoDB:', err.message)
  }
}

app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB()
  }
  next()
})

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/equipos', equipoRoutes)
app.use('/api/jugadores', jugadorRoutes)
app.use('/api/torneos', torneoRoutes)
app.use('/api/partidos', partidoRoutes)
app.use('/api/notificaciones', notificacionRoutes)

app.use((req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ msg: `La ruta ${req.originalUrl} no existe en este servidor` })
  }
  return res.status(404).json({ msg: 'No encontrado' })
})

app.use((err, req, res, next) => {
  console.error('Error no controlado:', err.stack)
  res.status(400).json({ msg: 'Ocurrió un error al procesar la solicitud' })
})




const PORT = process.env.PORT || 4000;

// Solo hace app.listen si no está siendo importado por un entorno serverless (como Vercel)
if (process.env.NODE_ENV !== 'production' || process.env.RENDER) {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
}

