// src/bot/commands/top.js
import { SlashCommandBuilder } from 'discord.js';
import { getTopUsers } from '../../services/xpService.js';
import { createTopEmbed } from '../../utils/embeds.js';
import { BOT_CONFIG } from '../config.js';

export const data = new SlashCommandBuilder()
  .setName('top')
  .setDescription('Muestra el ranking de usuarios')
  .addIntegerOption(option =>
    option.setName('cantidad')
      .setDescription(`Número de usuarios a mostrar (máx. ${BOT_CONFIG.topUsersLimit})`)
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(BOT_CONFIG.topUsersLimit)
  );

export async function execute(interaction) {
  await interaction.deferReply();
  
  const limit = interaction.options.getInteger('cantidad') || 10;
  const guildId = interaction.guild.id;

  try {
    const topUsers = await getTopUsers(guildId, limit);
    if (!topUsers.length) {
      return interaction.editReply('❌ No hay usuarios con XP aún.');
    }

    // Obtener nombres de usuario
    const usersWithNames = await Promise.all(topUsers.map(async user => {
      try {
        const member = await interaction.guild.members.fetch(user.userId);
        return { ...user, username: member.user.username };
      } catch {
        return { ...user, username: null };
      }
    }));

    const embed = createTopEmbed(usersWithNames, interaction.guild);
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error en comando top:', error);
    await interaction.editReply('❌ Error al obtener el ranking');
  }
}