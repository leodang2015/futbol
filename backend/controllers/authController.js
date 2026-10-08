import Usuario from '../models/Usuario.js'
import Equipo from '../models/Equipo.js'
import Jugador from '../models/Jugador.js'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.SECRETORPRIVATEKEY 

// Mapeo de códigos oficiales exigidos
export const CODIGOS_ROL = {
  organizador: '1',
  entrenador: '2',
  jugador: '3'
}

export const registro = async (req, res) => {
  try {
    const { usuario, password, rol, codigo, nombre, equipo, nombreEquipo, barriada, escudocolor, posicion } = req.body

    // 1. Validaciones básicas
    if (!usuario || typeof usuario !== 'string' || usuario.trim().length < 3) {
      return res.status(400).json({
        msg: 'El nombre de usuario es obligatorio y debe tener al menos 3 caracteres'
      })
    }

    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({
        msg: 'La contraseña debe tener al menos 4 caracteres'
      })
    }

    const rolNormalizado = (rol || '').toLowerCase().trim()
    if (!['organizador', 'entrenador', 'jugador'].includes(rolNormalizado)) {
      return res.status(400).json({
        msg: 'El rol seleccionado no es válido. Opciones: organizador, entrenador, jugador'
      })
    }

    // 2. Validación del código según el rol solicitado
    const codigoIngresado = String(codigo || CODIGOS_ROL[rolNormalizado]).trim()
    const codigoEsperado = CODIGOS_ROL[rolNormalizado]

    if (codigoIngresado !== codigoEsperado) {
      return res.status(400).json({
        msg: 'Código de acceso no válido para el rol seleccionado.'
      })
    }

    // 3. Comprobar si el nombre de usuario ya existe
    const usernameClean = usuario.toLowerCase().trim()
    const usuarioExistente = await Usuario.findOne({ usuario: usernameClean })
    if (usuarioExistente) {
      return res.status(400).json({
        msg: `El nombre de usuario "${usernameClean}" ya está en uso. Por favor elige otro.`
      })
    }

    let equipoAsignadoId = null
    let nuevoEquipoCreado = null

    // 4. Regla: Entrenador debe obligatoriamente crear un equipo propio único (solo 1 entrenador por equipo)
    if (rolNormalizado === 'entrenador') {
      const nombreClub = (nombreEquipo || '').trim()
      if (!nombreClub || nombreClub.length < 3) {
        return res.status(400).json({
          msg: 'Como entrenador debes obligatoriamente crear un equipo propio (mínimo 3 caracteres).'
        })
      }

      // Validar que no exista ya un equipo con ese nombre
      const equipoExistente = await Equipo.findOne({
        nombre: { $regex: new RegExp(`^${nombreClub}$`, 'i') }
      })
      if (equipoExistente) {
        return res.status(400).json({
          msg: `El club "${nombreClub}" ya existe en el torneo. Cada entrenador debe fundar su equipo propio único.`
        })
      }

      // Crear el nuevo equipo propio para este entrenador
      nuevoEquipoCreado = new Equipo({
        nombre: nombreClub,
        tecnico: (nombre || usernameClean).trim(),
        capitan: (req.body.capitan || '').trim(),
        barriada: (barriada || 'Barrio Central').trim(),
        escudocolor: escudocolor || '#059669',
        escudoUrl: req.body.escudoUrl || '',
        escudoFigura: req.body.escudoFigura || '🛡️'
      })
      await nuevoEquipoCreado.save()
      equipoAsignadoId = nuevoEquipoCreado._id
    }

    // 5. Regla: Jugador debe obligatoriamente escoger un equipo existente y su posición táctica
    if (rolNormalizado === 'jugador') {
      if (!equipo) {
        return res.status(400).json({
          msg: 'Como jugador debes escoger obligatoriamente un equipo existente en la plataforma.'
        })
      }

      const posLimpia = (posicion || '').trim()
      if (!posLimpia) {
        return res.status(400).json({
          msg: 'Como jugador debes escoger obligatoriamente tu posición táctica en el campo (Portero, Defensa, Mediocampista o Delantero).'
        })
      }

      const equipoExistente = await Equipo.findById(equipo)
      if (!equipoExistente) {
        return res.status(400).json({
          msg: 'El equipo seleccionado no existe en la plataforma.'
        })
      }
      equipoAsignadoId = equipoExistente._id

      // Registrar al jugador en la nómina oficial del equipo con su posición elegida
      const emailFicha = `${usernameClean}@futbolito.local`
      const fichaExistente = await Jugador.findOne({ email: emailFicha })
      if (!fichaExistente) {
        const countJugadores = await Jugador.countDocuments({ equipo: equipoExistente._id })
        await Jugador.create({
          nombre: (nombre || usernameClean).trim(),
          apellido: '-',
          numero: countJugadores + 1,
          posicion: posLimpia,
          equipo: equipoExistente._id,
          email: emailFicha,
          password: password
        })
      }
    }

    // 6. Crear y guardar usuario
    const nuevoUsuario = new Usuario({
      usuario: usernameClean,
      nombre: (nombre || usernameClean).trim(),
      rol: rolNormalizado,
      codigoUsado: codigoIngresado,
      equipo: equipoAsignadoId,
      posicion: rolNormalizado === 'jugador' ? (posicion || '').trim() : ''
    })

    nuevoUsuario.setPassword(password)
    await nuevoUsuario.save()

    // 7. Generar token JWT
    const token = jwt.sign(
      { id: nuevoUsuario._id, usuario: nuevoUsuario.usuario, rol: nuevoUsuario.rol },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      msg: 'Usuario registrado exitosamente',
      usuario: nuevoUsuario,
      token,
      equipoCreado: nuevoEquipoCreado
    })
  } catch (error) {
    console.error('Error en registro de usuario:', error)
    res.status(400).json({
      msg: error.message || 'Error al procesar el registro'
    })
  }
}

export const login = async (req, res) => {
  try {
    const { usuario, password } = req.body

    if (!usuario || !password) {
      return res.status(400).json({
        msg: 'Debes ingresar el usuario y la contraseña'
      })
    }

    const usernameClean = String(usuario).toLowerCase().trim()
    let user = await Usuario.findOne({ usuario: usernameClean }).populate('equipo')

    // Si no existe como Usuario, verificar si es un Jugador registrado en nómina oficial para ingresar con clave 1234
    if (!user) {
      const jugador = await Jugador.findOne({
        $or: [
          { nombre: { $regex: new RegExp(`^${usernameClean}$`, 'i') } },
          { email: usernameClean }
        ]
      }).populate('equipo')

      if (jugador && String(password).trim() === '1234') {
        user = new Usuario({
          usuario: usernameClean,
          nombre: jugador.nombre,
          rol: 'jugador',
          equipo: jugador.equipo ? (jugador.equipo._id || jugador.equipo) : null,
          posicion: jugador.posicion || 'Delantero'
        })
        user.setPassword('1234')
        await user.save()
        user = await Usuario.findById(user._id).populate('equipo')
      } else {
        return res.status(401).json({
          msg: 'Usuario no encontrado o credenciales incorrectas. Para jugadores registrados la contraseña es 1234.'
        })
      }
    } else {
      const passValido = user.validPassword(password) || (String(password).trim() === '1234' && user.rol === 'jugador')
      if (!passValido) {
        return res.status(401).json({
          msg: 'Contraseña incorrecta. (Para futbolistas la contraseña reglamentaria es 1234)'
        })
      }
    }

    if (!user.estado) {
      return res.status(403).json({
        msg: 'Esta cuenta ha sido desactivada'
      })
    }

    // Vincular equipo si el entrenador o jugador aún no lo tiene enlazado
    if (user.rol === 'entrenador' && !user.equipo) {
      const eq = await Equipo.findOne({
        $or: [
          { tecnico: { $regex: new RegExp(`^${user.usuario}$`, 'i') } },
          { tecnico: { $regex: new RegExp(`^${user.nombre}$`, 'i') } },
          { capitan: { $regex: new RegExp(`^${user.usuario}$`, 'i') } },
          { capitan: { $regex: new RegExp(`^${user.nombre}$`, 'i') } }
        ]
      })
      if (eq) {
        user.equipo = eq._id
        await user.save()
        user = await Usuario.findById(user._id).populate('equipo')
      }
    } else if (user.rol === 'jugador' && !user.equipo) {
      const j = await Jugador.findOne({
        $or: [
          { nombre: { $regex: new RegExp(`^${user.nombre}$`, 'i') } },
          { email: { $regex: new RegExp(`^${user.usuario}`, 'i') } }
        ]
      })
      if (j && j.equipo) {
        user.equipo = j.equipo
        await user.save()
        user = await Usuario.findById(user._id).populate('equipo')
      }
    }

    const token = jwt.sign(
      { id: user._id, usuario: user.usuario, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      msg: 'Inicio de sesión exitoso',
      usuario: user,
      token
    })
  } catch (error) {
    console.error('Error en login:', error)
    res.status(400).json({
      msg: error.message || 'Error al iniciar sesión'
    })
  }
}

export const perfil = async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ msg: 'Token no proporcionado' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)

    const user = await Usuario.findById(decoded.id).populate('equipo')
    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado' })
    }

    res.json({ usuario: user })
  } catch (error) {
    res.status(401).json({ msg: 'Token inválido o expirado' })
  }
}

export const codigosInfo = (req, res) => {
  res.json({
    codigos: {
      organizador: '1',
      entrenador: '2',
      jugador: '3'
    },
    descripcion: 'Código 1 para Organizador, Código 2 para Entrenador, Código 3 para Jugadores'
  })
}
