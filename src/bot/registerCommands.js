// src/bot/registerCommands.js
import { readdirSync } from 'fs';
import { join } from 'path';

export function registerCommands(client) {
  // Corrige la ruta para que funcione desde cualquier ubicación del proyecto
  const commandsPath = join(process.cwd(), 'bot', 'commands');
  
  const readCommands = async (path) => {
    const items = readdirSync(path, { withFileTypes: true });
    
    for (const item of items) {
      if (item.isDirectory()) {
        await readCommands(join(path, item.name));
      } else if (item.name.endsWith('.js')) {
        const command = await import(join(path, item.name));
        client.commands.set(command.data.name, command);
      }
    }
  };
  
  return readCommands(commandsPath);
}