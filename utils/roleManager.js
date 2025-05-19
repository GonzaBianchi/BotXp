// utils/roleManager.js
/**
 * Sistema de gestión de roles basados en niveles
 * Los roles se asignan cada 5 niveles y son exclusivos entre sí
 */

// Definición de los roles por nivel
export const LEVEL_ROLES = [
    { minLevel: 30, roleName: "──────『𝓨𝓸𝓷𝓴𝓸𝓾』──────" },
    { minLevel: 25, roleName: "──────『𝓒𝓸𝓶𝓪𝓷𝓭𝓪𝓷𝓽𝓮』──────" },
    { minLevel: 20, roleName: "──────『𝓢𝓱𝓲𝓬𝓱𝓲𝓫𝓾𝓴𝓪𝓲』──────" },
    { minLevel: 15, roleName: "──────『𝓢𝓾𝓹𝓮𝓻 𝓝𝓸𝓿𝓪』──────" },
    { minLevel: 10, roleName: "──────『𝓟𝓲𝓻𝓪𝓽𝓪』──────" },
    { minLevel: 5, roleName: "──────『𝓐𝓹𝓻𝓷𝓭𝓲𝓩』──────" }
  ];
  
  /**
   * Obtiene el rol correspondiente según el nivel del usuario
   * @param {number} level - Nivel del usuario
   * @returns {Object|null} Objeto con información del rol o null si no corresponde ningún rol
   */
  export function getRoleForLevel(level) {
    // Buscamos el primer rol que corresponda al nivel (ordenados de mayor a menor)
    return LEVEL_ROLES.find(role => level >= role.minLevel) || null;
  }
  
  /**
   * Actualiza los roles del usuario según su nivel
   * @param {Object} member - Objeto member de Discord.js
   * @param {number} level - Nivel actual del usuario
   * @returns {Promise<Object>} - Resultado de la actualización {success, added, removed}
   */
  export async function updateMemberRoles(member, level) {
    try {
      // Obtener el rol correspondiente al nivel actual
      const currentLevelRole = getRoleForLevel(level);
      
      // Lista para almacenar los resultados
      const result = {
        success: false,
        added: null,
        removed: []
      };
      
      // Si el usuario no tiene nivel suficiente para ningún rol, quitamos todos los roles de nivel
      if (!currentLevelRole) {
        // Quitar todos los roles de nivel si existen
        for (const roleConfig of LEVEL_ROLES) {
          const role = member.guild.roles.cache.find(r => r.name === roleConfig.roleName);
          if (role && member.roles.cache.has(role.id)) {
            await member.roles.remove(role);
            result.removed.push(roleConfig.roleName);
          }
        }
        result.success = true;
        return result;
      }
      
      // Buscar el rol correspondiente en el servidor
      const roleToAdd = member.guild.roles.cache.find(r => r.name === currentLevelRole.roleName);
      
      // Si el rol no existe en el servidor, retornar error
      if (!roleToAdd) {
        return {
          success: false,
          error: `El rol "${currentLevelRole.roleName}" no existe en el servidor`
        };
      }
      
      // Quitar roles de nivel anteriores (si los tiene)
      for (const roleConfig of LEVEL_ROLES) {
        // Saltamos el rol que vamos a añadir
        if (roleConfig.roleName === currentLevelRole.roleName) continue;
        
        const role = member.guild.roles.cache.find(r => r.name === roleConfig.roleName);
        if (role && member.roles.cache.has(role.id)) {
          await member.roles.remove(role);
          result.removed.push(roleConfig.roleName);
        }
      }
      
      // Añadir el nuevo rol si no lo tiene
      if (!member.roles.cache.has(roleToAdd.id)) {
        await member.roles.add(roleToAdd);
        result.added = currentLevelRole.roleName;
      }
      
      result.success = true;
      return result;
    } catch (error) {
      console.error('Error actualizando roles:', error);
      return {
        success: false,
        error: 'Error actualizando roles',
        details: error.message
      };
    }
  }