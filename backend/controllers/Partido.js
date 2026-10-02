import Partido from '../models/Partido.js';

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

    // Normalizar jornada / fecha
    const j = Number(jornada ?? fecha ?? 1);

    // Si no viene torneo, asignar el primer torneo existente en la base de datos
    if (!torneo) {
      const Torneo = (await import('../models/Torneo.js')).default;
      const t = await Torneo.findOne();
      if (t) {
        torneo = t._id;
      } else {
        return res.status(400).json({
          msg: "No hay ningún torneo registrado en la base de datos de MongoDB Atlas. Crea un torneo primero."
        });
      }
    }

    const nuevoPartido = new Partido({
      torneo,
      local,
      visitante,
      jornada: j,
      golesLocal: Number(golesLocal) || 0,
      golesVisitante: Number(golesVisitante) || 0,
      estado: estado === 'jugado' ? 'Finalizado' : (estado || 'Finalizado')
    });

    await nuevoPartido.save();
    const partidoPoblado = await Partido.findById(nuevoPartido._id).populate('local visitante');

    res.status(201).json({
      msg: 'Partido registrado exitosamente',
      partido: partidoPoblado
    });
  } catch (error) {
    console.error('Error al registrar partido:', error);
    res.status(400).json({
      msg: error.message || 'Error al registrar el partido'
    });
  }
};

export default { listarPartidos, cargarResultado, obtenerTablaPosiciones, crearPartido };

