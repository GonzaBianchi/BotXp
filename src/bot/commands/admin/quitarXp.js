// src/bot/commands/admin/removeXp.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { removeXp } from '../../../services/xpService.js';
import { updateMemberRoles } from '../../../services/roleService.js';
import { EmbedBuilder } from 'discord.js';
import { COLORS } from '../../config.js';

export const data = new SlashCommandBuilder()
  .setName('quitaxp')
  .setDescription('Quita XP a un usuario')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addUserOption(option =>
    option.setName('usuario')
      .setDescription('Usuario al que quitar XP')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName('cantidad')
      .setDescription('Cantidad de XP a quitar')
      .setRequired(true)
      .setMinValue(1)
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  
  const targetUser = interaction.options.getUser('usuario');
  const amount = interaction.options.getInteger('cantidad');
  const guildId = interaction.guild.id;

  try {
    const oldUser = await User.findOne({ userId: targetUser.id, guildId });
    const oldLevel = oldUser?.level || 1;
    
    const user = await removeXp(targetUser.id, guildId, amount);
    
    // Actualizar roles si bajó de nivel
    if (user.level < oldLevel) {
      const member = await interaction.guild.members.fetch(targetUser.id);
      await updateMemberRoles(member, user.level);
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.error)
      .setTitle('✅ XP Quitada')
      .setDescription(`Se quitaron ${amount} XP a ${targetUser}`)
      .addFields(
        { name: 'Nivel actual', value: user.level.toString(), inline: true },
        { name: 'XP actual', value: user.xp.toString(), inline: true }
      );
    
    if (user.level < oldLevel) {
      embed.addFields({
        name: '⚠️ Bajada de nivel',
        value: `De nivel ${oldLevel} a ${user.level}`
      });
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error en comando quitaxp:', error);
    await interaction.editReply({
      content: '❌ Error al quitar XP',
      ephemeral: true
    });
  }
}