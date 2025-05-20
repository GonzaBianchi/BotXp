// src/bot/commands/admin/xpMultiplicador.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { setXpMultiplier, getXpMultiplier } from '../../../services/serverConfigService.js';

export const data = new SlashCommandBuilder()
  .setName('xpmultiplicador')
  .setDescription('Establece el multiplicador global de XP para este servidor')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addNumberOption(option =>
    option.setName('multiplicador')
      .setDescription('Valor del multiplicador (ej: 1, 2, 4, 0.5)')
      .setRequired(true)
      .setMinValue(0.1)
      .setMaxValue(100)
  );

export async function execute(interaction) {
  const guildId = interaction.guild.id;
  const multiplier = interaction.options.getNumber('multiplicador');

  await setXpMultiplier(guildId, multiplier);
  await interaction.reply({
    content: `✅ El multiplicador de XP ahora es x${multiplier} para este servidor.`,
    ephemeral: true
  });
}
