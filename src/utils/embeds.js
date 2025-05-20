// src/utils/embeds.js
import { EmbedBuilder } from 'discord.js';
import { COLORS } from '../bot/config.js';
import { calculateLevelXp } from './xpSystem.js';

export function createLevelUpEmbed(user, newLevel) {
  return new EmbedBuilder()
    .setColor(COLORS.success)
    .setTitle('🎉 ¡Subida de nivel!')
    .setDescription(`¡Felicidades ${user}, ahora eres nivel **${newLevel}**!`)
    .setThumbnail(user.displayAvatarURL())
    .setFooter({ text: 'Sistema de niveles' })
    .setTimestamp();
}

export function createRoleUnlockedEmbed(user, roleName) {
  return new EmbedBuilder()
    .setColor(COLORS.warning)
    .setTitle('🏅 ¡Nuevo Rango Obtenido!')
    .setDescription(`¡Felicidades ${user}! Has desbloqueado el rango **${roleName}**`)
    .setThumbnail(user.displayAvatarURL())
    .setFooter({ text: 'Sistema de rangos' })
    .setTimestamp();
}

export function createLevelEmbed(user, levelData, rank) {
  const xpForNextLevel = calculateLevelXp(levelData.level);
  const progressPercentage = Math.floor((levelData.xp / xpForNextLevel) * 100);
  
  return new EmbedBuilder()
    .setColor(COLORS.primary)
    .setTitle(`📊 Nivel de ${user.username}`)
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      { name: 'Nivel', value: `${levelData.level}`, inline: true },
      { name: 'XP', value: `${levelData.xp}/${xpForNextLevel}`, inline: true },
      { name: 'Ranking', value: `#${rank}`, inline: true }
    )
    .setFooter({ text: `${progressPercentage}% para el siguiente nivel` })
    .setTimestamp();
}

export function createTopEmbed(topUsers, guild) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.warning)
    .setTitle(`🏆 Top ${topUsers.length} usuarios`)
    .setFooter({ text: guild.name, iconURL: guild.iconURL() })
    .setTimestamp();

  topUsers.forEach((user, index) => {
    embed.addFields({
      name: `#${index + 1} ${user.username || 'Usuario desconocido'}`,
      value: `Nivel ${user.level} (${user.xp} XP)`,
      inline: false
    });
  });

  return embed;
}

export function createInfoEmbed() {
  const xpExamples = [1, 5, 10].map(lvl => ({
    level: lvl,
    xp: calculateLevelXp(lvl)
  }));

  return new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle('ℹ️ Sistema de Niveles')
    .addFields(
      {
        name: '📝 Cómo ganar XP',
        value: 'Ganas 15-25 XP por mensaje (con cooldown de 1 minuto)'
      },
      {
        name: '⬆️ Subir de nivel',
        value: xpExamples.map(e => `Nivel ${e.level} → ${e.xp} XP`).join('\n')
      },
      {
        name: '🏅 Rangos por nivel',
        value: LEVEL_ROLES.map(r => `Nivel ${r.minLevel}+: ${r.roleName}`).join('\n')
      }
    );
}