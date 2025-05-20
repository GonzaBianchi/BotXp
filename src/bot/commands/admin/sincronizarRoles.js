// bot/commands/admin/sincronizarRoles.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { syncLevelRolesWithGuild } from '../../../services/levelRoleService.js';

// Comando slash para sincronizar los roles de nivel con la base de datos
export const data = new SlashCommandBuilder()
  .setName('sincronizarroles')
  .setDescription('Sincroniza los roles de nivel del servidor con la base de datos')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

/**
 * Ejecuta la sincronización de roles de nivel.
 * Solo para administradores.
 */
export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  try {
    await syncLevelRolesWithGuild(interaction.guild);
    await interaction.editReply('✅ Sincronización de roles de nivel completada.');
  } catch (error) {
    console.error('Error al sincronizar roles de nivel:', error);
    await interaction.editReply('❌ Ocurrió un error al sincronizar los roles de nivel.');
  }
}
