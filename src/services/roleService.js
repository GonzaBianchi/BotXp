// src/services/roleService.js
import { updateMemberRoles } from '../utils/roleManager.js';

export async function syncUserRoles(member, level) {
  return await updateMemberRoles(member, level);
}

export async function verifyGuildRoles(guild) {
  const missingRoles = [];
  const existingRoles = [];
  
  for (const roleConfig of LEVEL_ROLES) {
    const role = guild.roles.cache.find(r => r.name === roleConfig.roleName);
    if (role) {
      existingRoles.push(roleConfig.roleName);
    } else {
      missingRoles.push(roleConfig.roleName);
    }
  }
  
  return { existingRoles, missingRoles };
}

// Exporta updateMemberRoles directamente para uso en comandos admin
export { updateMemberRoles } from '../utils/roleManager.js';