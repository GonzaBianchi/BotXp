// src/bot/events/ready.js
import { deployCommands } from '../deployCommands.js';
import { syncLevelRolesWithGuild } from '../../services/levelRoleService.js';

export default async function handleReady(client) {
  console.log(`✅ Bot listo como ${client.user.tag}`);
  
  // Sincronizar roles de nivel al iniciar
  for (const [guildId, guild] of client.guilds.cache) {
    await syncLevelRolesWithGuild(guild);
  }

  try {
    console.log('⏳ Registrando comandos slash...');
    await deployCommands(client);
    console.log('✅ Comandos slash registrados correctamente');
  } catch (error) {
    console.error('❌ Error registrando comandos slash:', error);
  }

  // Establecer estado del bot
  client.user.setActivity('/nivel | /top', { type: 'WATCHING' });
}