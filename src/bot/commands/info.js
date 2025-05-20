// src/bot/commands/info.js
import { SlashCommandBuilder } from 'discord.js';
import { createInfoEmbed } from '../../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('info')
  .setDescription('Información sobre el sistema de niveles');

export async function execute(interaction) {
  try {
    const embed = createInfoEmbed();
    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error en comando info:', error);
    await interaction.reply({
      content: '❌ Error al mostrar la información',
      ephemeral: true
    });
  }
}