// src/utils/roleManager.js
// Utilidades para la gestión dinámica de roles de nivel
import { getLevelRoles } from '../services/levelRoleService.js';

/**
 * Actualiza los roles de nivel de un miembro según su nivel actual.
 * - Obtiene la configuración de roles de la base de datos.
 * - Quita todos los roles de nivel que el usuario tenga.
 * - Añade el rol de nivel más alto que le corresponde según su nivel.
 * @param {GuildMember} member - Miembro de Discord
 * @param {number} level - Nivel actual del usuario
 * @returns {Promise<Object>} - Resultado con info de roles añadidos/removidos
 */
export async function updateMemberRoles(member, level) {
  // Obtén los roles de nivel desde la base de datos
  const levelRoles = await getLevelRoles(member.guild.id);
  if (!levelRoles.length) return { success: false, error: 'No hay roles de nivel configurados.' };

  // Ordena por nivel descendente y busca el rol más alto que el usuario puede tener
  const sorted = levelRoles.sort((a, b) => b.level - a.level);
  const currentLevelRole = sorted.find(r => level >= r.level);
  const result = { success: false, added: null, removed: [] };

  // Quita todos los roles de nivel que el usuario tenga
  for (const roleData of levelRoles) {
    const role = member.guild.roles.cache.get(roleData.roleId);
    if (role && member.roles.cache.has(role.id)) {
      await member.roles.remove(role);
      result.removed.push(role.name);
    }
  }

  // Añade el rol correspondiente si corresponde
  if (currentLevelRole) {
    const roleToAdd = member.guild.roles.cache.get(currentLevelRole.roleId);
    if (roleToAdd) {
      await member.roles.add(roleToAdd);
      result.added = roleToAdd.name;
      result.success = true;
      return result;
    }
  }
  result.success = true;
  return result;
}