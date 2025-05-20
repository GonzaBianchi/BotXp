// src/services/xpService.js
import User from '../models/User.js';
import { calculateLevelXp } from '../utils/xpSystem.js';

export async function addXp(userId, guildId, amount) {
  let user = await User.findOneAndUpdate(
    { userId, guildId },
    { $inc: { xp: amount } },
    { upsert: true, new: true }
  );

  let leveledUp = false;
  let neededXp = calculateLevelXp(user.level);
  
  while (user.xp >= neededXp) {
    user.level += 1;
    user.xp -= neededXp;
    leveledUp = true;
    neededXp = calculateLevelXp(user.level);
  }
  
  if (leveledUp) {
    await user.save();
  }

  return user;
}

export async function removeXp(userId, guildId, amount) {
  let user = await User.findOne({ userId, guildId });
  
  if (!user) {
    user = new User({ userId, guildId, xp: 0, level: 1 });
  }
  
  user.xp -= amount;
  
  while (user.xp < 0 && user.level > 1) {
    user.level -= 1;
    user.xp += calculateLevelXp(user.level - 1);
  }
  
  if (user.level === 1 && user.xp < 0) {
    user.xp = 0;
  }
  
  await user.save();
  return user;
}

export async function setLevelAndXp(userId, guildId, level, xp = 0) {
  const newLevel = Math.max(1, level);
  const newXp = Math.max(0, xp);
  
  const user = await User.findOneAndUpdate(
    { userId, guildId },
    { level: newLevel, xp: newXp },
    { upsert: true, new: true }
  );
  
  return user;
}

export async function getUserRank(userId, guildId) {
  const userDoc = await User.findOne({ userId, guildId });
  
  if (!userDoc) {
    return (await User.countDocuments({ guildId })) + 1;
  }
  
  const usersAbove = await User.countDocuments({
    guildId,
    $or: [
      { level: { $gt: userDoc.level } },
      { level: userDoc.level, xp: { $gt: userDoc.xp } }
    ]
  });

  return usersAbove + 1;
}

export async function getTopUsers(guildId, limit = 10) {
  return User.find({ guildId })
    .sort({ level: -1, xp: -1 })
    .limit(limit)
    .lean();
}