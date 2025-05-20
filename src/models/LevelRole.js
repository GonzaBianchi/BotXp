// models/LevelRole.js
import mongoose from 'mongoose';

// Esquema para almacenar la relación entre roles de nivel y el nivel requerido en cada servidor
const LevelRoleSchema = new mongoose.Schema({
  guildId: { type: String, required: true }, // ID del servidor
  roleId: { type: String, required: true },  // ID del rol
  roleName: { type: String, required: true }, // Nombre del rol
  level: { type: Number, required: true }     // Nivel requerido para obtener el rol
});

export default mongoose.model('LevelRole', LevelRoleSchema);
