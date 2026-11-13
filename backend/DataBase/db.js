import mongoose from "mongoose";

export const x = async () => {
  try {
    const uri = process.env.MONGO_URI || "";
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Conexión exitosa a MongoDB");
  } catch (error) {
    console.warn("Aviso de conexión a MongoDB:", error.message);
  }
};

export default x;
