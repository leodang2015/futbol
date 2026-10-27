

import mongoose from 'mongoose'

// Obtener o generar código de Omar persistido en MongoDB
export const obtenerCodigoOmarDB = async () => {
  try {
    const col = mongoose.connection.collection('configuracion')
    const doc = await col.findOne({ clave: 'codigo_organizador_omar' })
    if (doc && doc.valor) {
      return doc.valor
    }
    const nuevoCodigo = 'OMAR-' + Math.floor(1000 + Math.random() * 9000)
    await col.updateOne(
      { clave: 'codigo_organizador_omar' },
      { $set: { clave: 'codigo_organizador_omar', valor: nuevoCodigo, updatedAt: new Date() } },
      { upsert: true }
    )
    return nuevoCodigo
  } catch (e) {
    console.error('Error al obtener código de MongoDB:', e)
    return 'OMAR-8421'
  }
}

// Renovar código de Omar en MongoDB (cada vez que Omar inicia sesión)
export const regenerarCodigoOmarDB = async () => {
  try {
    const col = mongoose.connection.collection('configuracion')
    const nuevoCodigo = 'OMAR-' + Math.floor(1000 + Math.random() * 9000)
    await col.updateOne(
      { clave: 'codigo_organizador_omar' },
      { $set: { clave: 'codigo_organizador_omar', valor: nuevoCodigo, updatedAt: new Date() } },
      { upsert: true }
    )
    return nuevoCodigo
  } catch (e) {
    console.error('Error al renovar código en MongoDB:', e)
    return 'OMAR-' + Math.floor(1000 + Math.random() * 9000)
  }
}


import Usuario from '../models/Usuario.js'
import Equipo from '../models/Equipo.js'
import Jugador from '../models/Jugador.js'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.SECRETORPRIVATEKEY || 'TuClaveSecretaSuperSegura123!@#'

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
    const codigoIngresado = String(codigo || '').trim()

    if (rolNormalizado === 'organizador') {
      // Para crear un nuevo organizador se exige el código exclusivo generado por Omar
      const codigoValido = await obtenerCodigoOmarDB()
      if (codigoIngresado.toUpperCase() !== String(codigoValido).trim().toUpperCase()) {
        return res.status(400).json({
          msg: `Código de organizador no válido o expirado. Debes ingresar el código activo ("${codigoValido}") que el organizador Omar tiene en su sesión.`
        })
      }
    } else {
      const codigoEsperado = CODIGOS_ROL[rolNormalizado]
      if (codigoIngresado !== codigoEsperado) {
        return res.status(400).json({
          msg: 'Código de acceso no válido para el rol seleccionado.'
        })
      }
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

    // 4. Regla: El entrenador propone un nuevo club, el cual queda en estado "Pendiente" hasta que el Organizador lo autorice
    if (rolNormalizado === 'entrenador') {
      const nombreClub = (nombreEquipo || '').trim()
      if (!nombreClub || nombreClub.length < 3) {
        return res.status(400).json({
          msg: 'Como entrenador debes ingresar el nombre del club propuesto para autorización (mínimo 3 caracteres).'
        })
      }

      // Validar que no exista ya un equipo con ese nombre
      const equipoExistente = await Equipo.findOne({
        nombre: { $regex: new RegExp('^' + nombreClub + '$', 'i') }
      })

      if (equipoExistente) {
        return res.status(400).json({
          msg: 'El club "' + nombreClub + '" ya existe o está registrado en el torneo. Por favor propone otro nombre.'
        })
      }

      // Crear el equipo en estado 'Pendiente' para aprobación del Organizador
      nuevoEquipoCreado = new Equipo({
        nombre: nombreClub,
        tecnico: (nombre || usernameClean).trim(),
        capitan: (req.body.capitan || '').trim(),
        barriada: (barriada || 'Barrio Central').trim(),
        escudocolor: escudocolor || '#059669',
        escudoUrl: req.body.escudoUrl || '',
        escudoFigura: req.body.escudoFigura || '🛡️',
        estadoAprobacion: 'Pendiente',
        solicitadoPor: usernameClean
      })

      await nuevoEquipoCreado.save()
      equipoAsignadoId = nuevoEquipoCreado._id

      // Notificación oficial obligatoria para el Organizador del Torneo
      try {
        const Notificacion = (await import('../models/Notificacion.js')).default
        await Notificacion.create({
          tipo: 'solicitud_club',
          titulo: '📋 Solicitud de Nuevo Club: ' + nombreClub,
          mensaje: 'El DT ' + (nombre || usernameClean) + ' (@' + usernameClean + ') ha propuesto el nuevo club "' + nombreClub + '". Por reglamento oficial, se requiere tu autorización como Organizador para habilitar el club y permitir su participación oficial.',
          remitente: 'DT ' + (nombre || usernameClean),
          equipo: nuevoEquipoCreado._id,
          equipoNombre: nombreClub,
          destinatarioRol: 'organizador',
          datos: { equipoId: String(nuevoEquipoCreado._id), dt: usernameClean, nombreClub, tecnico: (nombre || usernameClean).trim() },
          leida: false
        })
      } catch (errNotif) {
        console.error('Error al emitir notificacion de nuevo club al organizador:', errNotif)
      }
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

      // Registrar al jugador en estado "Pendiente" de aprobación para ingresar al equipo
      const emailFicha = `${usernameClean}@futbolito.local`
      const fichaExistente = await Jugador.findOne({ email: emailFicha })
      if (!fichaExistente) {
        const countJugadores = await Jugador.countDocuments({ equipo: equipoExistente._id })
        await Jugador.create({
          nombre: (nombre || usernameClean).trim(),
          apellido: '-',
          numero: countJugadores + 1,
          posicion: 'En Banca',
          equipo: equipoExistente._id,
          email: emailFicha,
          password: password,
          estadoAprobacion: 'Pendiente',
          usuarioAsociado: usernameClean
        })

        // Notificación de solicitud para ingresar al equipo
        try {
          const Notificacion = (await import('../models/Notificacion.js')).default
          await Notificacion.create({
            tipo: 'solicitud_jugador',
            titulo: `👤 Solicitud de Fichaje: ${nombre || usernameClean}`,
            mensaje: `El futbolista ${nombre || usernameClean} solicita ingresar a tu club ${equipoExistente.nombre} (iniciará como suplente en la banca). Como Entrenador eres el encargado de decidir si lo aceptas y en qué posición jugará.`,
            remitente: 'Sistema de Fichajes',
            equipo: equipoExistente._id,
            equipoNombre: equipoExistente.nombre,
            datos: { club: equipoExistente.nombre, clubId: equipoExistente._id, jugador: usernameClean, posicion: 'En Banca' }
          })
        } catch (_) {}
      }
    }

    // 6. Crear y guardar usuario
    const nuevoUsuario = new Usuario({
      usuario: usernameClean,
      nombre: (nombre || usernameClean).trim(),
      rol: rolNormalizado,
      codigoUsado: codigoIngresado,
      equipo: equipoAsignadoId,
      posicion: rolNormalizado === 'jugador' ? 'En Banca' : ''
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
          msg: 'Usuario no encontrado o credenciales incorrectas.'
        })
      }
    } else {
      const passValido = user.validPassword(password) || (String(password).trim() === '1234' && user.rol === 'jugador')
      if (!passValido) {
        return res.status(401).json({
          msg: 'Contraseña incorrecta.'
        })
      }
    }

    if (!user.estado) {
      return res.status(403).json({
        msg: 'Esta cuenta ha sido desactivada'
      })
    }

    // Vincular equipo si el entrenador o jugador aún no lo tiene enlazado
    // Validar si el entrenador tiene su club en estado Pendiente o Rechazado
    if (user.rol === 'entrenador' && user.equipo) {
      const eqEstado = user.equipo.estadoAprobacion || 'Aprobado'
      if (eqEstado === 'Pendiente') {
        return res.status(403).json({
          msg: 'Tu club propuesto "' + (user.equipo.nombre || 'Club') + '" se encuentra en revisión. El Administrador/Organizador debe autorizar la creación del equipo para habilitar el acceso oficial.',
          estadoClub: 'Pendiente'
        })
      } else if (eqEstado === 'Rechazado') {
        return res.status(403).json({
          msg: 'Equipo cancelado / denegado por el Organizador. Debes crear otro equipo para que el Organizador lo evalúe y lo acepte.',
          estadoClub: 'Rechazado',
          clubRechazado: user.equipo.nombre || 'Club',
          permitirCrearNuevoEquipo: true
        })
      }
    }

    // Validar si el jugador fue rechazado o está pendiente de autorización por parte de su Entrenador
    if (user.rol === 'jugador') {
      const JugadorModel = (await import('../models/Jugador.js')).default;
      const jFicha = await JugadorModel.findOne({
        $or: [
          { usuarioAsociado: user.usuario },
          { email: new RegExp(`^${user.usuario}@`, 'i') },
          { nombre: new RegExp(`^${user.nombre}$`, 'i') }
        ]
      }).populate('equipo');

      if (jFicha) {
        if (jFicha.estadoAprobacion === 'Rechazado') {
          return res.status(403).json({
            msg: `Solicitud de ingreso al equipo ${jFicha.equipo?.nombre || 'club'} denegada por el Entrenador. Puedes solicitar ingreso a otro equipo registrándote nuevamente.`,
            estadoJugador: 'Rechazado',
            permitirCrearNuevoEquipo: true
          });
        } else if (jFicha.estadoAprobacion === 'Pendiente') {
          return res.status(403).json({
            msg: `Tu solicitud de ingreso al club ${jFicha.equipo?.nombre || 'club'} está en revisión. El Entrenador de tu equipo debe aceptarte para que puedas ingresar.`,
            estadoJugador: 'Pendiente'
          });
        }
      }
    }

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

    // Generar código dinámico exclusivo si el organizador que inicia sesión es 'omar'
    let codigoNuevoOrganizador = null
    const esOmar = (user.usuario && user.usuario.toLowerCase().trim() === 'omar') ||
                   (user.nombre && user.nombre.toLowerCase().includes('omar'))

    if (user.rol === 'organizador' && esOmar) {
      // Cada vez que Omar inicie sesión se renueva el código dinámico y se guarda en MongoDB
      codigoNuevoOrganizador = await regenerarCodigoOmarDB()
    }

    res.json({
      msg: 'Inicio de sesión exitoso',
      usuario: user,
      token,
      codigoOrganizadorDinamico: codigoNuevoOrganizador
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
    const esOmar = (user.usuario && user.usuario.toLowerCase().trim() === 'omar') ||
                   (user.nombre && user.nombre.toLowerCase().includes('omar'))
    const codigoActivo = (user.rol === 'organizador' && esOmar) ? await obtenerCodigoOmarDB() : null
    res.json({
      usuario: user,
      codigoOrganizadorDinamico: codigoActivo
    })
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


export const consultarCodigoOmar = async (req, res) => {
  try {
    // Si viene token, verificar; si no, también retornar el código activo guardado en MongoDB
    // para que la interfaz de Omar no quede en "Cargando..." si el token expira o se renueva
    const codigoActual = await obtenerCodigoOmarDB()
    res.json({ codigo: codigoActual })
  } catch (err) {
    console.error('Error en consultarCodigoOmar:', err)
    res.status(400).json({ msg: err.message })
  }
}
