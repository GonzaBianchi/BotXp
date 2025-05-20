// src/bot/commands/admin/addXp.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { addXp } from '../../../services/xpService.js';
import { updateMemberRoles } from '../../../services/roleService.js';
import { EmbedBuilder } from 'discord.js';
import { COLORS } from '../../config.js';

export const data = new SlashCommandBuilder()
  .setName('agregaxp')
  .setDescription('Añade XP a un usuario')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addUserOption(option =>
    option.setName('usuario')
      .setDescription('Usuario al que añadir XP')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName('cantidad')
      .setDescription('Cantidad de XP a añadir')
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
    
    const user = await addXp(targetUser.id, guildId, amount);
    
    // Actualizar roles si subió de nivel
    if (user.level > oldLevel) {
      const member = await interaction.guild.members.fetch(targetUser.id);
      await updateMemberRoles(member, user.level);
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.success)
      .setTitle('✅ XP Añadida')
      .setDescription(`Se añadieron ${amount} XP a ${targetUser}`)
      .addFields(
        { name: 'Nivel actual', value: user.level.toString(), inline: true },
        { name: 'XP actual', value: user.xp.toString(), inline: true }
      );
    
    if (user.level > oldLevel) {
      embed.addFields({
        name: '🎉 Subida de nivel',
        value: `De nivel ${oldLevel} a ${user.level}`
      });
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error en comando agregaxp:', error);
    await interaction.editReply({
      content: '❌ Error al añadir XP',
      ephemeral: true
    });
  }
}