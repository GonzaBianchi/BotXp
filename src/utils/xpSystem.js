// src/utils/xpSystem.js
/**
 * Calcula la XP necesaria para un nivel específico
 * @param {number} level - El nivel actual
 * @returns {number} XP necesaria para el siguiente nivel
 */
export function calculateLevelXp(level) {
  return 5 * Math.pow(level, 2) + 50 * level + 100;
}