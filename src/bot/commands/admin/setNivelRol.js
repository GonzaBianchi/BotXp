// bot/commands/admin/setNivelRol.js
// Comando para asignar un nivel requerido a un rol de nivel en el servidor
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { setLevelForRole } from '../../../services/levelRoleService.js';

// Definición del comando slash /setnivelrol
export const data = new SlashCommandBuilder()
  .setName('setnivelrol')
  .setDescription('Asigna un nivel a un rol de nivel')
  // Solo administradores pueden usar este comando
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  // Opción para seleccionar el rol
  .addRoleOption(option =>
    option.setName('rol')
      .setDescription('Rol de nivel')
      .setRequired(true)
  )
  // Opción para indicar el nivel requerido
  .addIntegerOption(option =>
    option.setName('nivel')
      .setDescription('Nivel requerido para el rol')
      .setRequired(true)
      .setMinValue(1)
  );

/**
 * Ejecuta el comando /setnivelrol
 * Permite a un administrador asignar el nivel requerido a un rol de nivel.
 * Guarda la relación en la base de datos para que el bot la use dinámicamente.
 */
export async function execute(interaction) {
  // Obtiene el rol y el nivel de las opciones del comando
  const role = interaction.options.getRole('rol');
  const level = interaction.options.getInteger('nivel');
  const guildId = interaction.guild.id;

  // Guarda o actualiza la relación rol-nivel en la base de datos
  // Si el rol ya existe, actualiza el nivel; si no, lo crea
  await setLevelForRole(guildId, role.id, role.name, level);

  // Responde al administrador confirmando la acción
  // El mensaje es solo visible para el admin que ejecutó el comando
  await interaction.reply({
    content: `✅ El rol ${role} ahora requiere nivel ${level}.`,
    ephemeral: true
  });
}
