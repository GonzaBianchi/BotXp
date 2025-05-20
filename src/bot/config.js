// src/config.js
export const BOT_CONFIG = {
  intents: [
    'Guilds',
    'GuildMessages',
    'MessageContent',
    'GuildMembers'
  ],
  cooldownTime: 60000, // 1 minuto en ms
  xpRange: { min: 15, max: 25 },
  topUsersLimit: 10
};

// Los roles de nivel ahora se gestionan dinámicamente desde la base de datos.
// Si necesitas acceder a los roles de nivel, usa el servicio levelRoleService.js

export const COLORS = {
  primary: '#4287f5',
  success: '#00FF00',
  warning: '#FFD700',
  error: '#FF6347',
  info: '#9B59B6'
};