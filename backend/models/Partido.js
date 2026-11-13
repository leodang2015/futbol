import { Schema, model } from 'mongoose'

const partidoSchema = new Schema({
  torneo: { type: Schema.Types.ObjectId, ref: 'Torneo', required: true },
  local: { type: Schema.Types.ObjectId, ref: 'Equipo', required: true },
  visitante: { type: Schema.Types.ObjectId, ref: 'Equipo', required: true },
  jornada: { type: Number, required: true },
  golesLocal: { type: Number, default: 0, min: 0 },
  golesVisitante: { type: Number, default: 0, min: 0 },
  estado: { type: String, enum: ['Programado', 'Finalizado'], default: 'Programado' },
  goleadores: [{
    jugador: { type: Schema.Types.ObjectId, ref: 'Jugador' },
    minuto: Number
  }],
  tarjetas: [{
    jugador: { type: Schema.Types.ObjectId, ref: 'Jugador' },
    tipo: { type: String, enum: ['Amarilla', 'Roja'] }
  }]
}, { timestamps: true })

export default model('Partido', partidoSchema)
