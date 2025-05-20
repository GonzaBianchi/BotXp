// src/services/serverConfigService.js
import ServerConfig from '../models/ServerConfig.js';

export async function getXpMultiplier(guildId) {
  const config = await ServerConfig.findOne({ guildId });
  return config?.xpMultiplier || 1;
}

export async function setXpMultiplier(guildId, multiplier) {
  return ServerConfig.findOneAndUpdate(
    { guildId },
    { xpMultiplier: multiplier },
    { upsert: true, new: true }
  );
}
