import { Schema, model } from 'mongoose'

const equipoSchema = new Schema({
  nombre: { 
    type: String, 
    required: true, 
    trim: true,
    unique: true 
  },
  escudocolor: { 
    type: String, 
    default: 'bg-emerald-600' 
  },
  capitan: { 
    type: String, 
    required: true, 
    trim: true 
  },
  barriada: { 
    type: String, 
    required: true, 
    trim: true 
  }
}, { 
  timestamps: true 
})

export default model('Equipo', equipoSchema)
