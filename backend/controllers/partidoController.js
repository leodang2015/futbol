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

    // Normalizar jornada / fecha
    const j = Number(jornada ?? fecha ?? 1);

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

export const actualizarGoleadores = async (req, res) => {
  try {
    const { id } = req.params;
    const { goleadores, golesLocal, golesVisitante } = req.body;

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
      partido.goleadores = goleadores;
    }
    partido.estado = 'Finalizado';

    await partido.save();
    const partidoPoblado = await Partido.findById(partido._id).populate('local visitante');

    res.json({
      msg: 'Goleadores y resultado registrados exitosamente',
      partido: partidoPoblado
    });
  } catch (error) {
    console.error('Error al actualizar goleadores:', error);
    res.status(400).json({ msg: error.message || 'Error al actualizar los goleadores' });
  }
};

export default { listarPartidos, cargarResultado, obtenerTablaPosiciones, crearPartido, actualizarGoleadores };
