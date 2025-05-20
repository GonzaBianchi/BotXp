// src/bot/events/messageCreate.js
import { addXp } from '../../services/xpService.js';
import { updateMemberRoles } from '../../services/roleService.js';
import { BOT_CONFIG } from '../config.js';
import { createLevelUpEmbed, createRoleUnlockedEmbed } from '../../utils/embeds.js';
import { getXpMultiplier } from '../../services/serverConfigService.js';

const cooldowns = new Map();

export default async function handleMessageCreate(message) {
  if (message.author.bot || !message.guild) return;

  const { id: userId } = message.author;
  const { id: guildId } = message.guild;
  const cooldownKey = `${userId}-${guildId}`;

  // Verificar cooldown
  if (cooldowns.has(cooldownKey) && Date.now() < cooldowns.get(cooldownKey)) return;

  // Obtener multiplicador de XP para el servidor
  const xpMultiplier = await getXpMultiplier(guildId);

  // Añadir XP (aplicando multiplicador)
  const oldUser = await User.findOne({ userId, guildId });
  const oldLevel = oldUser?.level || 1;
  
  const baseXp = getRandomXP();
  const user = await addXp(userId, guildId, Math.round(baseXp * xpMultiplier));
  cooldowns.set(cooldownKey, Date.now() + BOT_CONFIG.cooldownTime);

  // Verificar subida de nivel
  if (user.level > oldLevel) {
    const levelUpEmbed = createLevelUpEmbed(message.author, user.level);
    await message.channel.send({ embeds: [levelUpEmbed] });

    // Actualizar roles
    try {
      const member = await message.guild.members.fetch(userId);
      const roleResult = await updateMemberRoles(member, user.level);
      
      if (roleResult.added) {
        const roleEmbed = createRoleUnlockedEmbed(message.author, roleResult.added);
        await message.channel.send({ embeds: [roleEmbed] });
      }
    } catch (error) {
      console.error('Error actualizando roles:', error);
    }
  }
}