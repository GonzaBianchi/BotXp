// src/bot/events/interactionCreate.js
import {
  handleLevelCommand,
  handleTopCommand,
  handleInfoCommand,
  handleAddXpCommand,
  handleRemoveXpCommand,
  handleSetLevelCommand,
  handleRolesCommand,
  handleSetNivelRolCommand,
  handleSincronizarRolesCommand,
  handleXpMultiplicadorCommand
} from '../commands/indexCommands.js';

export default async function handleInteractionCreate(interaction) {
  if (!interaction.isCommand()) return;

  try {
    const commandHandlers = {
      'nivel': handleLevelCommand,
      'top': handleTopCommand,
      'info': handleInfoCommand,
      'agregaxp': handleAddXpCommand,
      'quitaxp': handleRemoveXpCommand,
      'establecernivel': handleSetLevelCommand,
      'roles': handleRolesCommand,
      'setnivelrol': handleSetNivelRolCommand,
      'sincronizarroles': handleSincronizarRolesCommand,
      'xpmultiplicador': handleXpMultiplicadorCommand
    };

    const handler = commandHandlers[interaction.commandName.toLowerCase()];
    if (handler) {
      await handler(interaction);
    } else {
      await interaction.reply({
        content: '❌ Comando no reconocido',
        ephemeral: true
      });
    }
  } catch (error) {
    console.error(`Error en comando ${interaction.commandName}:`, error);
    
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content: '❌ Error al procesar el comando',
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: '❌ Error al ejecutar el comando',
        ephemeral: true
      });
    }
  }
}