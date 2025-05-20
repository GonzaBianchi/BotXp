// src/bot/commands/level.js
import { SlashCommandBuilder } from 'discord.js';
import User from '../../models/User.js';
import { getUserRank } from '../../services/xpService.js';
import { createLevelEmbed } from '../../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('nivel')
  .setDescription('Muestra tu nivel y XP actual')
  .addUserOption(option =>
    option.setName('usuario')
      .setDescription('Usuario a consultar')
      .setRequired(false)
  );

export async function execute(interaction) {
  await interaction.deferReply();
  
  const targetUser = interaction.options.getUser('usuario') || interaction.user;
  const guildId = interaction.guild.id;

  try {
    const userData = await User.findOne({ userId: targetUser.id, guildId });
    if (!userData) {
      return interaction.editReply('❌ Este usuario no tiene XP registrado.');
    }

    const rank = await getUserRank(targetUser.id, guildId);
    const embed = createLevelEmbed(targetUser, userData, rank);
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error en comando nivel:', error);
    await interaction.editReply('❌ Error al obtener el nivel');
  }
}