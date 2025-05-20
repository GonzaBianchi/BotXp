// src/bot/commands/index.js
export * as LevelCommand from './nivel.js';
export * as TopCommand from './top.js';
export * as InfoCommand from './info.js';
export * as AddXpCommand from './admin/agregarXp.js';
export * as RemoveXpCommand from './admin/quitarXp.js';
export * as SetLevelCommand from './admin/establecerXp.js';
export * as SetNivelRolCommand from './admin/setNivelRol.js';
export * as SincronizarRolesCommand from './admin/sincronizarRoles.js';
export * as XpMultiplicadorCommand from './admin/xpMultiplicador.js';

export async function handleLevelCommand(interaction) {
  await LevelCommand.execute(interaction);
}

export async function handleTopCommand(interaction) {
  await TopCommand.execute(interaction);
}

export async function handleInfoCommand(interaction) {
  await InfoCommand.execute(interaction);
}

export async function handleAddXpCommand(interaction) {
  await AddXpCommand.execute(interaction);
}

export async function handleRemoveXpCommand(interaction) {
  await RemoveXpCommand.execute(interaction);
}

export async function handleSetLevelCommand(interaction) {
  await SetLevelCommand.execute(interaction);
}

export async function handleRolesCommand(interaction) {
  await RolesCommand.execute(interaction);
}

export async function handleSetNivelRolCommand(interaction) {
  await SetNivelRolCommand.default.execute(interaction);
}

export async function handleSincronizarRolesCommand(interaction) {
  await SincronizarRolesCommand.default.execute(interaction);
}

export async function handleXpMultiplicadorCommand(interaction) {
  await XpMultiplicadorCommand.default.execute(interaction);
}