import Equipo from '../models/Equipo.js';

export const crearEquipo = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (nombre) {
      const existeEquipo = await Equipo.findOne({ nombre });
      if (existeEquipo) {
        return res.status(400).json({
          msg: "El nombre del equipo ya se encuentra registrado"
        });
      }
    }

    const equipo = new Equipo(req.body);
    await equipo.save();

    res.status(201).json(equipo);

  } catch (error) {
    console.error("Error en crearEquipo:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        msg: "El equipo ya se encuentra registrado"
      });
    }

    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        msg: mensajes.join(', ')
      });
    }

    res.status(400).json({
      msg: error.message || "Error al registrar el equipo"
    });
  }
};

export const listarEquipos = async (req, res) => {
  try {
    const equipos = await Equipo.find();
    res.json(equipos);

  } catch (error) {
    console.error("Error en listarEquipos:", error);
    res.status(400).json({
      msg: "Error al consultar la lista de equipos"
    });
  }
};

export const editarEquipo = async (req, res) => {
  try {
    const { id } = req.params;

    const equipo = await Equipo.findByIdAndUpdate(
      id, 
      req.body, 
      { new: true, runValidators: true }
    );

    if (!equipo) {
      return res.status(404).json({
        msg: "El equipo no existe en la base de datos"
      });
    }

    res.json(equipo);

  } catch (error) {
    console.error("Error en editarEquipo:", error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        msg: "El ID proporcionado no es un ObjectId válido"
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        msg: "El nombre ingresado ya le pertenece a otro equipo"
      });
    }

    res.status(400).json({
      msg: "No se pudo actualizar la información del equipo"
    });
  }
};

export const eliminarEquipo = async (req, res) => {
  try {
    const { id } = req.params;

    const equipo = await Equipo.findByIdAndDelete(id);

    if (!equipo) {
      return res.status(404).json({
        msg: "El equipo no existe en la base de datos"
      });
    }

    res.json({
      msg: "Equipo eliminado correctamente"
    });

  } catch (error) {
    console.error("Error en eliminarEquipo:", error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        msg: "El ID proporcionado no es un ObjectId válido"
      });
    }

    res.status(400).json({
      msg: "No se pudo eliminar el equipo"
    });
  }
};

export default { crearEquipo, listarEquipos, editarEquipo, eliminarEquipo };
