// src/bot/commands/admin/setLevel.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { setLevelAndXp } from '../../../services/xpService.js';
import { updateMemberRoles } from '../../../services/roleService.js';
import { EmbedBuilder } from 'discord.js';
import { COLORS } from '../../config.js';

export const data = new SlashCommandBuilder()
  .setName('establecernivel')
  .setDescription('Establece nivel y XP de un usuario')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addUserOption(option =>
    option.setName('usuario')
      .setDescription('Usuario a modificar')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName('nivel')
      .setDescription('Nivel a establecer')
      .setRequired(true)
      .setMinValue(1)
  )
  .addIntegerOption(option =>
    option.setName('xp')
      .setDescription('XP a establecer (opcional)')
      .setRequired(false)
      .setMinValue(0)
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  
  const targetUser = interaction.options.getUser('usuario');
  const level = interaction.options.getInteger('nivel');
  const xp = interaction.options.getInteger('xp') || 0;
  const guildId = interaction.guild.id;

  try {
    const user = await setLevelAndXp(targetUser.id, guildId, level, xp);
    const member = await interaction.guild.members.fetch(targetUser.id);
    await updateMemberRoles(member, user.level);

    const embed = new EmbedBuilder()
      .setColor(COLORS.primary)
      .setTitle('✅ Nivel Establecido')
      .setDescription(`Se estableció el nivel de ${targetUser}`)
      .addFields(
        { name: 'Nivel', value: user.level.toString(), inline: true },
        { name: 'XP', value: user.xp.toString(), inline: true }
      );

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error en comando establecernivel:', error);
    await interaction.editReply({
      content: '❌ Error al establecer nivel',
      ephemeral: true
    });
  }
}