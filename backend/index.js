import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'

import equipoRoutes from './routes/equipoRoutes.js'
import jugadorRoutes from './routes/jugadorRoutes.js'
import torneoRoutes from './routes/torneoRoutes.js'
import partidoRoutes from './routes/partidoRoutes.js'

dotenv.config()

const app = express()

// Middlewares globales
app.use(cors())
app.use(express.json())

// API health and info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  })
})

// Montaje de rutas de la API
app.use('/api/equipos', equipoRoutes)
app.use('/api/jugadores', jugadorRoutes)
app.use('/api/torneos', torneoRoutes)
app.use('/api/partidos', partidoRoutes)

// Control para rutas no encontradas (404)
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ msg: `La ruta ${req.originalUrl} no existe en este servidor` })
  }
  next()
})

// Control global de excepciones
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err.stack)
  res.status(400).json({ msg: 'Ocurrió un error al procesar la solicitud' })
})

const PORT = process.env.BACKEND_PORT || 4000
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb+srv://javierpintorodriguez27_db_user:Vpm0KjNxypMN5dv1@cluster0.9ron6ec.mongodb.net/futbolito"

export { app }

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000
})
  .then(() => {
    console.log('Conectado a MongoDB Atlas exitosamente')
  })
  .catch((err) => {
    console.warn('Aviso de conexión a MongoDB:', err.message)
  })

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`)
})

export default app
