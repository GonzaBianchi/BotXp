// index.js
import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import express from 'express';
import { connectToDatabase } from './services/database.js';
import handleReady from './bot/events/ready.js';
import handleMessageCreate from './bot/events/messageCreate.js';
import handleInteractionCreate from './bot/events/interactionCreate.js';

dotenv.config();

// Conexión a MongoDB
connectToDatabase();

// Inicializar cliente de Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Registrar eventos
client.once('ready', () => handleReady(client));
client.on('messageCreate', handleMessageCreate);
client.on('interactionCreate', handleInteractionCreate);

// Login del bot
client.login(process.env.TOKEN);

// --- Servidor Express para mantener activo el bot ---
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
  res.send('Bot de Discord activo 🚀');
});
app.listen(PORT, () => {
  console.log(`🌐 Servidor Express escuchando en el puerto ${PORT}`);
});
