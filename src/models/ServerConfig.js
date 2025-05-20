// src/models/ServerConfig.js
import mongoose from 'mongoose';

const ServerConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  xpMultiplier: { type: Number, default: 1 }
});

export default mongoose.model('ServerConfig', ServerConfigSchema);
