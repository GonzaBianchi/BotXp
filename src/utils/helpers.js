// src/utils/helpers.js
export function createProgressBar(percentage, length = 20) {
  const progress = Math.floor((percentage / 100) * length);
  return '█'.repeat(progress) + '░'.repeat(length - progress);
}

export function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function getRandomXP(min = 15, max = 25) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function isAdmin(member) {
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

export function truncate(text, length = 100) {
  return text.length > length ? text.substring(0, length) + '...' : text;
}