// src/bot/deployCommands.js
import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { readdirSync } from 'fs';
import { join } from 'path';

dotenv.config();

export async function deployCommands(client) {
  const commands = [];
  // Corrige la ruta para que funcione desde cualquier ubicación del proyecto
  const commandsPath = join(process.cwd(), 'bot', 'commands');
  
  // Leer todos los archivos de comandos
  const readCommands = async (path) => {
    const items = readdirSync(path, { withFileTypes: true });
    
    for (const item of items) {
      if (item.isDirectory()) {
        await readCommands(join(path, item.name));
      } else if (item.name.endsWith('.js')) {
        // Ignora archivos que no son comandos slash válidos (como indexCommands.js)
        if (item.name.toLowerCase().includes('index')) continue;
        // Corrige la ruta para import dinámico compatible con ESM y Windows
        const commandPath = join(path, item.name).replace(/\\/g, '/');
        const commandModule = await import('file://' + commandPath);
        // Soporta export default y export const data
        const command = commandModule.default || commandModule;
        if (command.data && typeof command.data.toJSON === 'function') {
          commands.push(command.data.toJSON());
        } else {
          console.warn(`El archivo ${item.name} no exporta un objeto data válido para slash commands.`);
        }
      }
    }
  };
  
  await readCommands(commandsPath);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
  } catch (error) {
    throw error;
  }
}