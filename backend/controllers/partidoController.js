import Partido from '../models/Partido.js';
import Equipo from '../models/Equipo.js';
import Jugador from '../models/Jugador.js';

export const listarPartidos = async (req, res) => {
  try {
    const { jornada, equipo, torneo } = req.query;
    let filtro = {};

    if (torneo) filtro.torneo = torneo;
    if (jornada) filtro.jornada = jornada;
    if (equipo) filtro.$or = [{ local: equipo }, { visitante: equipo }];

    const partidos = await Partido.find(filtro).populate('local visitante');

    res.json(partidos);

  } catch (error) {
    console.error("Error en listarPartidos:", error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        msg: "El parámetro de búsqueda proporcionado no es un ID válido"
      });
    }

    res.status(400).json({
      msg: "Error al consultar los partidos"
    });
  }
};

export const cargarResultado = async (req, res) => {
  try {
    const { id } = req.params;
    const { golesLocal, golesVisitante, goleadores, tarjetas } = req.body;

    const partido = await Partido.findById(id);

    if (!partido) {
      return res.status(404).json({
        msg: "El partido no existe en la base de datos"
      });
    }

    if (partido.estado === 'Finalizado') {
      return res.status(400).json({
        msg: "El resultado de este partido ya fue cargado previamente"
      });
    }

    // Regla Oficial: Solo se podrá jugar cuando el entrenador escoja al capitán del equipo
    const eqLocal = await Equipo.findById(partido.local);
    const eqVisitante = await Equipo.findById(partido.visitante);
    const jugsLocal = await Jugador.find({ equipo: partido.local });
    const jugsVisitante = await Jugador.find({ equipo: partido.visitante });
    const capLocal = Boolean(eqLocal?.capitan?.trim()) || jugsLocal.some(j => j.esCapitan);
    const capVisitante = Boolean(eqVisitante?.capitan?.trim()) || jugsVisitante.some(j => j.esCapitan);

    if (!capLocal) {
      return res.status(400).json({
        msg: `Solo se podrá jugar cuando el entrenador escoja al capitán del equipo. El club "${eqLocal?.nombre || 'Local'}" no tiene capitán designado.`
      });
    }
    if (!capVisitante) {
      return res.status(400).json({
        msg: `Solo se podrá jugar cuando el entrenador escoja al capitán del equipo. El club "${eqVisitante?.nombre || 'Visitante'}" no tiene capitán designado.`
      });
    }

    if (golesLocal < 0 || golesVisitante < 0) {
      return res.status(400).json({
        msg: "Los goles no pueden ser números negativos"
      });
    }

    partido.golesLocal = golesLocal;
    partido.golesVisitante = golesVisitante;
    partido.goleadores = goleadores || [];
    partido.tarjetas = tarjetas || [];
    partido.estado = 'Finalizado';

    await partido.save();

    res.json({
      msg: "Resultado cargado exitosamente",
      partido
    });

  } catch (error) {
    console.error("Error en cargarResultado:", error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        msg: "El ID del partido no es un ObjectId válido"
      });
    }

    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        msg: mensajes.join(', ')
      });
    }

    res.status(400).json({
      msg: "No se pudo registrar el resultado del partido"
    });
  }
};

export const obtenerTablaPosiciones = async (req, res) => {
  try {
    const { torneoId } = req.params;

    const partidos = await Partido.find({ torneo: torneoId, estado: 'Finalizado' }).populate('local visitante');

    const tabla = {};

    partidos.forEach(p => {
      if (!p.local || !p.visitante) return;

      const l = p.local._id.toString();
      const v = p.visitante._id.toString();
      const nombreL = p.local.nombre;
      const nombreV = p.visitante.nombre;

      if (!tabla[l]) tabla[l] = { equipo: nombreL, pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0 };
      if (!tabla[v]) tabla[v] = { equipo: nombreV, pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0 };

      tabla[l].pj += 1;
      tabla[v].pj += 1;

      tabla[l].gf += p.golesLocal;
      tabla[l].gc += p.golesVisitante;
      tabla[v].gf += p.golesVisitante;
      tabla[v].gc += p.golesLocal;

      if (p.golesLocal > p.golesVisitante) {
        tabla[l].pts += 3; 
        tabla[l].pg += 1;
        tabla[v].pp += 1;
      } else if (p.golesLocal < p.golesVisitante) {
        tabla[v].pts += 3; 
        tabla[v].pg += 1;
        tabla[l].pp += 1;
      } else {
        tabla[l].pts += 1; 
        tabla[l].pe += 1;
        tabla[v].pts += 1; 
        tabla[v].pe += 1;
      }
    });

    Object.values(tabla).forEach(t => t.dg = t.gf - t.gc);

    const resultadoFinal = Object.values(tabla).sort((a, b) => b.pts - a.pts || b.dg - a.dg);

    res.json(resultadoFinal);

  } catch (error) {
    console.error("Error en obtenerTablaPosiciones:", error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        msg: "El ID del torneo no es un ObjectId válido"
      });
    }

    res.status(400).json({
      msg: "No se pudo generar la tabla de posiciones"
    });
  }
};

export const crearPartido = async (req, res) => {
  try {
    let { torneo, local, visitante, jornada, fecha, golesLocal, golesVisitante, estado } = req.body;

    if (!local || !visitante) {
      return res.status(400).json({
        msg: 'Debes seleccionar tanto el equipo local como el visitante.'
      });
    }

    if (String(local) === String(visitante)) {
      return res.status(400).json({
        msg: 'El equipo local y el equipo visitante no pueden ser el mismo club.'
      });
    }

    const equipoLocal = await Equipo.findById(local);
    const equipoVisitante = await Equipo.findById(visitante);

    if (!equipoLocal || !equipoVisitante) {
      return res.status(400).json({
        msg: 'Uno o ambos equipos seleccionados no existen en la base de datos.'
      });
    }

    // Regla Oficial: Un equipo solo se podrá registrar a partidos cuando sus jugadores sean mínimo de 11 personas
    const countLocal = await Jugador.countDocuments({ equipo: local });
    const countVisitante = await Jugador.countDocuments({ equipo: visitante });

    if (countLocal < 11) {
      return res.status(400).json({
        msg: `El club "${equipoLocal.nombre}" no puede disputar partidos: solo tiene ${countLocal} jugadores en nómina. Se exige un mínimo reglamentario de 11 personas para registrarse a partidos.`
      });
    }

    if (countVisitante < 11) {
      return res.status(400).json({
        msg: `El club "${equipoVisitante.nombre}" no puede disputar partidos: solo tiene ${countVisitante} jugadores en nómina. Se exige un mínimo reglamentario de 11 personas para registrarse a partidos.`
      });
    }

    // Regla Oficial: Solo se permite jugar con máximo 11 jugadores en la cancha (los demás en banca)
    const jugadoresLocal = await Jugador.find({ equipo: local });
    const jugadoresVisitante = await Jugador.find({ equipo: visitante });
    const esBanca = (pos) => {
      const p = String(pos || '').toLowerCase();
      return p.includes('banc') || p.includes('supl');
    };
    const enCanchaLocal = jugadoresLocal.filter(j => !esBanca(j.posicion)).length;
    const enCanchaVisitante = jugadoresVisitante.filter(j => !esBanca(j.posicion)).length;

    if (enCanchaLocal > 11) {
      return res.status(400).json({
        msg: `Advertencia reglamentaria: El club "${equipoLocal.nombre}" tiene ${enCanchaLocal} jugadores en cancha. Solo se permite jugar con un máximo de 11 jugadores en la cancha (asigna el rol "En Banca" a los suplentes).`
      });
    }

    if (enCanchaVisitante > 11) {
      return res.status(400).json({
        msg: `Advertencia reglamentaria: El club "${equipoVisitante.nombre}" tiene ${enCanchaVisitante} jugadores en cancha. Solo se permite jugar con un máximo de 11 jugadores en la cancha (asigna el rol "En Banca" a los suplentes).`
      });
    }

    // Regla Oficial: Solo se podrá jugar cuando el entrenador escoja al capitán del equipo
    const tieneCapitanLocal = Boolean(equipoLocal.capitan && equipoLocal.capitan.trim()) || jugadoresLocal.some(j => j.esCapitan);
    const tieneCapitanVisitante = Boolean(equipoVisitante.capitan && equipoVisitante.capitan.trim()) || jugadoresVisitante.some(j => j.esCapitan);

    if (!tieneCapitanLocal) {
      return res.status(400).json({
        msg: `Regla reglamentaria: Solo se permite disputar partidos cuando el entrenador escoja al capitán del equipo. El club "${equipoLocal.nombre}" aún no tiene capitán designado.`
      });
    }

    if (!tieneCapitanVisitante) {
      return res.status(400).json({
        msg: `Regla reglamentaria: Solo se permite disputar partidos cuando el entrenador escoja al capitán del equipo. El club "${equipoVisitante.nombre}" aún no tiene capitán designado.`
      });
    }

    // Normalizar jornada / fecha (mínimo 1 y máximo 5)
    const j = Number(jornada ?? fecha ?? 1);
    if (j < 1 || j > 5) {
      return res.status(400).json({
        msg: 'Por reglamento oficial, el torneo tiene como mínimo la Fecha 1 y máximo la Fecha 5.'
      });
    }

    // Regla Oficial: Un equipo debe tener mínimo 2 fechas después de ese partido para jugar de nuevo
    const partidosPrevios = await Partido.find({
      $or: [
        { local: local }, { visitante: local },
        { local: visitante }, { visitante: visitante }
      ]
    });

    for (const p of partidosPrevios) {
      const fechaP = Number(p.jornada || 1);
      const involucraLocal = String(p.local) === String(local) || String(p.visitante) === String(local);
      const involucraVisitante = String(p.local) === String(visitante) || String(p.visitante) === String(visitante);

      if (involucraLocal && Math.abs(j - fechaP) < 2) {
        return res.status(400).json({
          msg: `Regla de descanso oficial: El club "${equipoLocal.nombre}" ya tiene un partido en la Jornada ${fechaP}. Debe tener como mínimo 2 fechas después de ese partido para jugar de nuevo (próxima fecha válida: Jornada ${fechaP + 2} o superior).`
        });
      }

      if (involucraVisitante && Math.abs(j - fechaP) < 2) {
        return res.status(400).json({
          msg: `Regla de descanso oficial: El club "${equipoVisitante.nombre}" ya tiene un partido en la Jornada ${fechaP}. Debe tener como mínimo 2 fechas después de ese partido para jugar de nuevo (próxima fecha válida: Jornada ${fechaP + 2} o superior).`
        });
      }
    }

    // Si no viene torneo, asignar o inicializar el torneo oficial de la liga
    if (!torneo) {
      const Torneo = (await import('../models/Torneo.js')).default;
      let t = await Torneo.findOne();
      if (!t) {
        t = await Torneo.create({
          nombre: 'Torneo Oficial Barrial 2026',
          categoria: 'Libre Masculino'
        });
      }
      torneo = t._id;
    }

    const fechaReal = req.body.fechaHora ? new Date(req.body.fechaHora) : new Date();
    if (fechaReal.getTime() > Date.now() + 65000) {
      return res.status(400).json({
        msg: 'Por reglamento oficial, el organizador debe fijar la fecha y hora en tiempo real y no puede ser posterior al momento actual.'
      });
    }

    const nuevoPartido = new Partido({
      torneo,
      local,
      visitante,
      jornada: j,
      fechaHora: fechaReal,
      golesLocal: Number(golesLocal) || 0,
      golesVisitante: Number(golesVisitante) || 0,
      asistenciasLocal: Number(req.body.asistenciasLocal) || 0,
      asistenciasVisitante: Number(req.body.asistenciasVisitante) || 0,
      estado: req.body.estado || 'Por Confirmar',
      confirmacionLocal: req.body.confirmacionLocal || false,
      confirmacionVisitante: req.body.confirmacionVisitante || false,
      confirmadoPorDTs: Boolean(req.body.confirmacionLocal && req.body.confirmacionVisitante)
    });

    await nuevoPartido.save();

    // Notificaciones oficiales automáticas para que los dos entrenadores confirmen que van a jugar
    try {
      const Notificacion = (await import('../models/Notificacion.js')).default;
      await Notificacion.create({
        tipo: 'convocatoria_partido',
        titulo: `📅 Convocatoria Oficial: Jornada ${j} vs ${equipoVisitante.nombre}`,
        mensaje: `El Organizador ha programado el partido de tu club ${equipoLocal.nombre} vs ${equipoVisitante.nombre} para la Jornada ${j}. Ambos entrenadores deben confirmar que van a jugar.`,
        remitente: 'Organizador del Torneo',
        equipo: equipoLocal._id,
        equipoNombre: equipoLocal.nombre,
        partido: nuevoPartido._id,
        datos: { partidoId: nuevoPartido._id, jornada: j, rival: equipoVisitante.nombre, esLocal: true }
      });

      await Notificacion.create({
        tipo: 'convocatoria_partido',
        titulo: `📅 Convocatoria Oficial: Jornada ${j} vs ${equipoLocal.nombre}`,
        mensaje: `El Organizador ha programado el partido de tu club ${equipoVisitante.nombre} vs ${equipoLocal.nombre} para la Jornada ${j}. Ambos entrenadores deben confirmar que van a jugar.`,
        remitente: 'Organizador del Torneo',
        equipo: equipoVisitante._id,
        equipoNombre: equipoVisitante.nombre,
        partido: nuevoPartido._id,
        datos: { partidoId: nuevoPartido._id, jornada: j, rival: equipoLocal.nombre, esLocal: false }
      });
    } catch (_) {}

    const partidoPoblado = await Partido.findById(nuevoPartido._id).populate('local visitante');

    res.status(201).json({
      msg: 'Partido registrado exitosamente y convocatoria enviada a ambos entrenadores para confirmar que van a jugar.',
      partido: partidoPoblado
    });
  } catch (error) {
    console.error('Error al registrar partido:', error);
    res.status(400).json({
      msg: error.message || 'Error al registrar el partido'
    });
  }
};

export const confirmarPartidoDT = async (req, res) => {
  try {
    const { id } = req.params;
    const { equipoId, entrenadorNombre } = req.body;

    const partido = await Partido.findById(id).populate('local visitante');
    if (!partido) {
      return res.status(404).json({ msg: 'El partido no existe en la base de datos' });
    }

    const eqIdStr = String(equipoId || '').trim();
    const locIdStr = String(partido.local._id || partido.local);
    const visIdStr = String(partido.visitante._id || partido.visitante);

    if (eqIdStr === locIdStr) {
      partido.confirmacionLocal = true;
    } else if (eqIdStr === visIdStr) {
      partido.confirmacionVisitante = true;
    } else {
      return res.status(400).json({ msg: 'Tu club no forma parte de este encuentro.' });
    }

    const Notificacion = (await import('../models/Notificacion.js')).default;

    if (partido.confirmacionLocal && partido.confirmacionVisitante) {
      partido.confirmadoPorDTs = true;
      if (partido.estado === 'Por Confirmar') {
        partido.estado = 'En Preparación';
      }

      // Notificar al organizador
      try {
        await Notificacion.create({
          tipo: 'partido_confirmado_dts',
          titulo: `✅ Ambos DTs Confirmaron: ${partido.local.nombre} vs ${partido.visitante.nombre}`,
          mensaje: `Los directores técnicos de ambos clubes han confirmado que van a jugar el partido de la Jornada ${partido.jornada}. El encuentro está listo en preparación; el organizador ya puede fijar los goles y asistencias oficiales.`,
          remitente: entrenadorNombre || 'Directores Técnicos',
          partido: partido._id,
          datos: { partidoId: partido._id, jornada: partido.jornada }
        });
      } catch (_) {}
    } else {
      try {
        const nombreClubConfirmado = eqIdStr === locIdStr ? partido.local.nombre : partido.visitante.nombre;
        await Notificacion.create({
          tipo: 'confirmacion_dt',
          titulo: `⚽ El DT de ${nombreClubConfirmado} confirmó su participación`,
          mensaje: `El DT de ${nombreClubConfirmado} confirmó que jugará el partido de la Jornada ${partido.jornada}. Se espera la confirmación del DT rival.`,
          remitente: entrenadorNombre || 'Entrenador',
          equipo: equipoId,
          partido: partido._id,
          datos: { partidoId: partido._id }
        });
      } catch (_) {}
    }

    await partido.save();
    const partidoPoblado = await Partido.findById(partido._id).populate('local visitante');

    res.json({
      msg: partido.confirmadoPorDTs 
        ? '¡Confirmado por ambos DTs! El partido pasa a estar En Preparación para disputarse.' 
        : '¡Tu club ha confirmado la participación! Esperando confirmación del DT rival.',
      partido: partidoPoblado
    });
  } catch (error) {
    console.error('Error al confirmar partido DT:', error);
    res.status(400).json({ msg: error.message || 'Error al confirmar partido' });
  }
};

export const fijarMarcadorOrganizador = async (req, res) => {
  try {
    const { id } = req.params;
    const { golesLocal, golesVisitante, asistenciasLocal, asistenciasVisitante } = req.body;

    const partido = await Partido.findById(id).populate('local visitante');
    if (!partido) {
      return res.status(404).json({ msg: 'El partido no existe en la base de datos' });
    }

    if (!partido.confirmacionLocal || !partido.confirmacionVisitante) {
      return res.status(400).json({
        msg: 'Ambos entrenadores deben confirmar que van a jugar antes de que el organizador pueda fijar el marcador y las asistencias.'
      });
    }

    partido.golesLocal = Number(golesLocal) || 0;
    partido.golesVisitante = Number(golesVisitante) || 0;
    partido.asistenciasLocal = Number(asistenciasLocal) || 0;
    partido.asistenciasVisitante = Number(asistenciasVisitante) || 0;
    partido.estado = 'En Preparación';

    await partido.save();

    // Notificar a los entrenadores
    try {
      const Notificacion = (await import('../models/Notificacion.js')).default;
      await Notificacion.create({
        tipo: 'marcador_fijado',
        titulo: `⚽ Marcador Oficial Fijado: ${partido.local.nombre} ${partido.golesLocal} - ${partido.golesVisitante} ${partido.visitante.nombre}`,
        mensaje: `El Organizador ha fijado el marcador oficial: ${partido.local.nombre} (${partido.golesLocal} goles, ${partido.asistenciasLocal} asistencias) vs ${partido.visitante.nombre} (${partido.golesVisitante} goles, ${partido.asistenciasVisitante} asistencias). Entrenadores: Ingresen a la Pizarra DT para escoger los autores de los goles. Los cuadros se crearán automáticamente.`,
        remitente: 'Organizador del Torneo',
        partido: partido._id,
        datos: {
          partidoId: partido._id,
          golesLocal: partido.golesLocal,
          golesVisitante: partido.golesVisitante,
          asistenciasLocal: partido.asistenciasLocal,
          asistenciasVisitante: partido.asistenciasVisitante
        }
      });
    } catch (_) {}

    const partidoPoblado = await Partido.findById(partido._id).populate('local visitante');
    res.json({
      msg: 'Marcador y asistencias fijados por el Organizador exitosamente.',
      partido: partidoPoblado
    });
  } catch (error) {
    console.error('Error al fijar marcador organizador:', error);
    res.status(400).json({ msg: error.message || 'Error al fijar marcador' });
  }
};

export const actualizarGoleadores = async (req, res) => {
  try {
    const { id } = req.params;
    const { goleadores, golesLocal, golesVisitante, equipoId } = req.body;

    const partido = await Partido.findById(id);
    if (!partido) {
      return res.status(404).json({ msg: 'El partido no existe en la base de datos' });
    }

    const eqLocal = await Equipo.findById(partido.local);
    const eqVisitante = await Equipo.findById(partido.visitante);
    const jugsLocal = await Jugador.find({ equipo: partido.local });
    const jugsVisitante = await Jugador.find({ equipo: partido.visitante });
    const capLocal = Boolean(eqLocal?.capitan?.trim()) || jugsLocal.some(j => j.esCapitan);
    const capVisitante = Boolean(eqVisitante?.capitan?.trim()) || jugsVisitante.some(j => j.esCapitan);

    if (!capLocal || !capVisitante) {
      return res.status(400).json({
        msg: 'Solo se podrá jugar y registrar goles cuando el entrenador escoja al capitán del equipo. Ambos equipos deben contar con capitán designado.'
      });
    }

    if (golesLocal !== undefined) partido.golesLocal = Number(golesLocal);
    if (golesVisitante !== undefined) partido.golesVisitante = Number(golesVisitante);

    if (Array.isArray(goleadores)) {
      const targetEqId = String(equipoId || '').trim();
      const otrosClubes = (partido.goleadores || []).filter(g => {
        const gEq = String(g.equipo || g.equipoId || '');
        return targetEqId && gEq && gEq !== targetEqId;
      });
      partido.goleadores = [...otrosClubes, ...goleadores];
    }
    partido.estado = 'Finalizado';

    await partido.save();
    const partidoPoblado = await Partido.findById(partido._id).populate('local visitante');

    res.json({
      msg: 'Goleadores registrados exitosamente por el Entrenador.',
      partido: partidoPoblado
    });
  } catch (error) {
    console.error('Error al actualizar goleadores:', error);
    res.status(400).json({ msg: error.message || 'Error al actualizar los goleadores' });
  }
};

export default { 
  listarPartidos, 
  cargarResultado, 
  obtenerTablaPosiciones, 
  crearPartido, 
  confirmarPartidoDT, 
  fijarMarcadorOrganizador, 
  actualizarGoleadores 
};
