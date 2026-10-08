import { Schema, model } from 'mongoose'

const partidoSchema = new Schema({
  torneo: { type: Schema.Types.ObjectId, ref: 'Torneo', required: true },
  local: { type: Schema.Types.ObjectId, ref: 'Equipo', required: true },
  visitante: { type: Schema.Types.ObjectId, ref: 'Equipo', required: true },
  jornada: { type: Number, required: true },
  fechaHora: { type: Date, default: Date.now },
  golesLocal: { type: Number, default: 0, min: 0 },
  golesVisitante: { type: Number, default: 0, min: 0 },
  asistenciasLocal: { type: Number, default: 0, min: 0 },
  asistenciasVisitante: { type: Number, default: 0, min: 0 },
  estado: { 
    type: String, 
    enum: ['Por Confirmar', 'En Preparación', 'Programado', 'Finalizado'], 
    default: 'Por Confirmar' 
  },
  confirmacionLocal: { type: Boolean, default: false },
  confirmacionVisitante: { type: Boolean, default: false },
  confirmadoPorDTs: { type: Boolean, default: false },
  goleadores: [{
    jugador: { type: Schema.Types.ObjectId, ref: 'Jugador' },
    jugadorId: String,
    nombre: String,
    dorsal: Number,
    minuto: Number,
    equipo: { type: Schema.Types.ObjectId, ref: 'Equipo' },
    equipoNombre: String,
    asistente: { type: Schema.Types.ObjectId, ref: 'Jugador' },
    asistenteNombre: String
  }],
  tarjetas: [{
    jugador: { type: Schema.Types.ObjectId, ref: 'Jugador' },
    tipo: { type: String, enum: ['Amarilla', 'Roja'] }
  }]
}, { timestamps: true })

export default model('Partido', partidoSchema)
