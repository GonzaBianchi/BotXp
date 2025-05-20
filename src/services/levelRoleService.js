// services/levelRoleService.js
import LevelRole from '../models/LevelRole.js';

/**
 * Obtiene todos los roles de nivel configurados para un servidor.
 * @param {string} guildId - ID del servidor (guild)
 * @returns {Promise<Array>} - Lista de roles de nivel
 */
export async function getLevelRoles(guildId) {
  return LevelRole.find({ guildId });
}

/**
 * Asigna o actualiza el nivel requerido para un rol de nivel en la base de datos.
 * Si el rol ya existe, actualiza el nombre y el nivel; si no, lo crea.
 * @param {string} guildId - ID del servidor
 * @param {string} roleId - ID del rol
 * @param {string} roleName - Nombre del rol
 * @param {number} level - Nivel requerido
 * @returns {Promise<Object>} - El documento actualizado o creado
 */
export async function setLevelForRole(guildId, roleId, roleName, level) {
  return LevelRole.findOneAndUpdate(
    { guildId, roleId },
    { roleName, level },
    { upsert: true, new: true }
  );
}

/**
 * Elimina la configuración de un rol de nivel de la base de datos.
 * @param {string} guildId - ID del servidor
 * @param {string} roleId - ID del rol
 * @returns {Promise<Object>} - Resultado de la operación
 */
export async function removeLevelRole(guildId, roleId) {
  return LevelRole.deleteOne({ guildId, roleId });
}

/**
 * Sincroniza los roles de nivel del servidor con la base de datos.
 * Detecta roles cuyo nombre cumple el patrón y los agrega/actualiza en la base de datos.
 * Elimina de la base de datos los roles que ya no existen en el servidor.
 * @param {Guild} guild - Objeto Guild de Discord.js
 */
export async function syncLevelRolesWithGuild(guild) {
  const pattern = /✦─────『.*』─────✦/;
  const roles = guild.roles.cache.filter(role => pattern.test(role.name));
  const dbRoles = await getLevelRoles(guild.id);
  const dbRoleIds = dbRoles.map(r => r.roleId);

  // Agrega o actualiza roles en la base de datos
  for (const role of roles.values()) {
    await setLevelForRole(guild.id, role.id, role.name, 1); // Nivel por defecto 1, el admin debe actualizar
  }

  // Elimina de la base de datos los roles que ya no existen en el servidor
  for (const dbRole of dbRoles) {
    if (!roles.has(dbRole.roleId)) {
      await removeLevelRole(guild.id, dbRole.roleId);
    }
  }
}
